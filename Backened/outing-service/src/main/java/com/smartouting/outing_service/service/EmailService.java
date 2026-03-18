package com.smartouting.outing_service.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender javaMailSender;
    public void sendOutingAlert(String toEmail , String studentName ,String reason){
        try{
            SimpleMailMessage message=new SimpleMailMessage();
            message.setFrom("smartOuting.system@gmail.com");
            message.setTo(toEmail);
            message.setSubject("🚨 OUTING ALERT: " + studentName + " has left campus");
            message.setText("Dear Parent,\n\n" +
                    "This is to inform you that your ward, " + studentName + ", has just left the campus.\n\n" +
                    "Reason Provided: " + reason + "\n\n" +
                    "If this was not authorized by you, please contact the Warden immediately.\n\n" +
                    "Regards,\nSmart Outing System");
            javaMailSender.send(message);
            System.out.println("✅ Email sent to parent: " + toEmail);
        }
        catch(Exception e ){
            System.err.println("❌ Failed to send email: " + e.getMessage());
        }
    }
}
