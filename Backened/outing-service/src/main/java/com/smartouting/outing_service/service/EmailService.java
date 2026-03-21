package com.smartouting.outing_service.service;

import com.smartouting.outing_service.model.Outing;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.Base64;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender javaMailSender;

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    public void sendOutingAlert(String toEmail , String studentName ,String reason){
        try{
            SimpleMailMessage message=new SimpleMailMessage();
            message.setFrom("smartOuting.system@gmail.com");
            message.setTo(toEmail);
            message.setSubject("\uD83D\uDEA8 OUTING ALERT: " + studentName + " has left campus");
            message.setText("Dear Parent,\n\n" +
                    "This is to inform you that your ward, " + studentName + ", has just left the campus.\n\n" +
                    "Reason Provided: " + reason + "\n\n" +
                    "If this was not authorized by you, please contact the Warden immediately.\n\n" +
                    "Regards,\nSmart Outing System");
            javaMailSender.send(message);
            System.out.println("\u2705 Email sent to parent: " + toEmail);
        }
        catch(Exception e ){
            System.err.println("\u274C Failed to send email: " + e.getMessage());
        }
    }

    /**
     * Sends an approval email with the QR code as an inline image to the student.
     */
    public void sendApprovalEmailWithQR(Outing outing) {
        try {
            MimeMessage mimeMessage = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom("smartOuting.system@gmail.com");
            helper.setTo(outing.getStudentEmail());
            helper.setSubject("\u2705 Outing Approved — Your Outing Pass #" + outing.getId());

            String outDate = outing.getOutDate() != null ? outing.getOutDate().format(FMT) : "N/A";
            String returnDate = outing.getReturnDate() != null ? outing.getReturnDate().format(FMT) : "N/A";

            String html = """
                <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
                  <div style="background:linear-gradient(135deg,#00B894,#2DD4BF);padding:28px 24px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:22px;">✅ Outing Approved!</h1>
                    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">Your outing request has been approved by the Warden</p>
                  </div>
                  <div style="padding:24px;">
                    <table style="width:100%%;border-collapse:collapse;margin-bottom:20px;">
                      <tr><td style="padding:10px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">Student</td><td style="padding:10px 0;font-weight:600;font-size:13px;text-align:right;border-bottom:1px solid #f3f4f6;">%s (%s)</td></tr>
                      <tr><td style="padding:10px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">Destination</td><td style="padding:10px 0;font-weight:600;font-size:13px;text-align:right;border-bottom:1px solid #f3f4f6;">%s</td></tr>
                      <tr><td style="padding:10px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">Out Date</td><td style="padding:10px 0;font-weight:600;font-size:13px;text-align:right;border-bottom:1px solid #f3f4f6;">%s</td></tr>
                      <tr><td style="padding:10px 0;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">Return Date</td><td style="padding:10px 0;font-weight:600;font-size:13px;text-align:right;border-bottom:1px solid #f3f4f6;">%s</td></tr>
                      <tr><td style="padding:10px 0;color:#6b7280;font-size:13px;">Warden Remark</td><td style="padding:10px 0;font-weight:600;font-size:13px;text-align:right;">%s</td></tr>
                    </table>
                    <div style="text-align:center;padding:20px;background:#f0fdf9;border-radius:12px;border:1px dashed #00B894;">
                      <p style="margin:0 0 12px;font-weight:700;color:#065f46;font-size:14px;">🎫 Your Outing Pass</p>
                      <p style="margin:0 0 12px;color:#6b7280;font-size:12px;">Show this QR code to the guard at the gate</p>
                      <img src='cid:qrcode' alt="QR Code" width="180" height="180" style="border-radius:8px;border:1px solid #e5e7eb;"/>
                      <p style="margin:12px 0 0;font-size:11px;color:#9ca3af;">Pass ID: #%d</p>
                    </div>
                    <div style="margin-top:20px;padding:14px;background:#fef3c7;border-radius:10px;border:1px solid #fde68a;">
                      <p style="margin:0;font-size:12px;color:#92400e;">⚠️ <strong>Important:</strong> Return before your scheduled return date. Late returns will be flagged and may affect future outing approvals.</p>
                    </div>
                  </div>
                  <div style="padding:16px 24px;background:#f9fafb;text-align:center;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:11px;color:#9ca3af;">Smart Outing System — Hostel Management</p>
                  </div>
                </div>
                """.formatted(
                    outing.getStudentName(), outing.getStudentId(),
                    outing.getDestination(),
                    outDate, returnDate,
                    outing.getWardenComment() != null ? outing.getWardenComment() : "—",
                    outing.getId()
            );

            helper.setText(html, true);

            // Extract base64 image data from the QR code URL and attach as inline image
            String qrBase64 = outing.getQrCodeUrl();
            if (qrBase64 != null && qrBase64.startsWith("data:image/png;base64,")) {
                byte[] qrBytes = Base64.getDecoder().decode(qrBase64.substring("data:image/png;base64,".length()));
                helper.addInline("qrcode", new ByteArrayResource(qrBytes), "image/png");
            }

            javaMailSender.send(mimeMessage);
            System.out.println("\u2705 Approval email with QR sent to student: " + outing.getStudentEmail());

        } catch (Exception e) {
            System.err.println("\u274C Failed to send approval email: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
