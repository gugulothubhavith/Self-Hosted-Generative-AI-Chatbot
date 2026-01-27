import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, html_content: str):
    """
    Send an email using Gmail SMTP
    """
    try:
        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_USER
        msg["To"] = to_email
        msg["Subject"] = subject
        
        msg.attach(MIMEText(html_content, "html"))
        
        # Connect to Gmail SMTP
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.starttls()  # Secure connection
        
        # Login
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        
        # Send
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

def send_otp_email(to_email: str, otp: str):
    subject = "Your Login OTP Code"
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                <h2 style="color: #333;">Login Verification</h2>
                <p>Use the following One-Time Password (OTP) to log in to AI Platform:</p>
                <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; border-radius: 4px;">
                    {otp}
                </div>
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                    This code will expire in 5 minutes.<br>
                    If you didn't request this code, please ignore this email.
                </p>
            </div>
        </body>
    </html>
    """
    
    # DEV MODE: Print OTP to console explicitly
    print(f"\n{'='*40}")
    print(f"OTP for {to_email}: {otp}")
    print(f"{'='*40}\n")
    
    if settings.SMTP_PASSWORD == "CHANGE_ME" or not settings.SMTP_PASSWORD:
        logger.warning("SMTP not configured. Mocking email sending.")
        return True

    return send_email(to_email, subject, html_content)
