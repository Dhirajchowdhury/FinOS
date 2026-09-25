import smtplib
import os
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone
from app.core.config import settings

logger = logging.getLogger("finos.email")
logging.basicConfig(level=logging.INFO)

DEV_INBOX_LOG_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "dev_inbox.log"
)

class EmailService:
    def get_settings(self):
        try:
            from app.core.config import Settings
            return Settings()
        except Exception:
            return settings

    def is_smtp_configured(self) -> bool:
        cfg = self.get_settings()
        return bool(cfg.SMTP_HOST and cfg.SMTP_HOST.strip())

    def send_verification_otp(self, recipient_email: str, otp_code: str) -> bool:
        """
        Delivers the 6-digit OTP to the recipient via configured SMTP transport.
        If SMTP is not configured or in dev mode, records to terminal & dev_inbox.log.
        """
        subject = f"FinOS — Your Verification Code: {otp_code}"
        expires_in = f"{settings.OTP_EXPIRE_MINUTES} minutes"

        html_body = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #080b11; color: #f8fafc; margin: 0; padding: 40px 20px; }}
            .container {{ max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
            .header {{ text-align: left; margin-bottom: 24px; border-bottom: 1px solid #1e293b; padding-bottom: 20px; }}
            .brand {{ font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }}
            .brand span {{ color: #10b981; }}
            .subtitle {{ font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }}
            .title {{ font-size: 18px; font-weight: 700; color: #f8fafc; margin-bottom: 12px; }}
            .text {{ font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }}
            .code-box {{ background: #0b0f19; border: 1px solid #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }}
            .otp {{ font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #10b981; font-family: monospace; }}
            .expiry {{ font-size: 12px; color: #64748b; margin-top: 8px; }}
            .security-note {{ font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 20px; margin-top: 28px; line-height: 1.5; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="brand">Fin<span>OS</span></div>
              <div class="subtitle">Financial Operating System</div>
            </div>
            <div class="title">Your One-Time Verification Code</div>
            <div class="text">
              Enter the following 6-digit code to securely authenticate and access your FinOS workspace:
            </div>
            <div class="code-box">
              <div class="otp">{otp_code}</div>
              <div class="expiry">Expires in {expires_in} &bull; One-time use only</div>
            </div>
            <div class="security-note">
              <strong>Security reminder:</strong> FinOS will never ask for your verification code via phone, chat, or social media. If you did not request this code, you can safely disregard this email.
            </div>
          </div>
        </body>
        </html>
        """

        plain_text = f"""FinOS — Financial Operating System
Your verification code is: {otp_code}

This code expires in {expires_in}.
If you did not request this code, you can safely ignore this email.
"""

        cfg = self.get_settings()
        if self.is_smtp_configured():
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = cfg.EMAIL_FROM
                msg["To"] = recipient_email

                msg.attach(MIMEText(plain_text, "plain"))
                msg.attach(MIMEText(html_body, "html"))

                with smtplib.SMTP(cfg.SMTP_HOST, cfg.SMTP_PORT, timeout=10) as server:
                    server.starttls()
                    clean_user = cfg.SMTP_USERNAME.strip() if cfg.SMTP_USERNAME else ""
                    clean_pass = cfg.SMTP_PASSWORD.strip().replace(" ", "") if cfg.SMTP_PASSWORD else ""
                    if clean_user and clean_pass:
                        server.login(clean_user, clean_pass)
                    sender_addr = clean_user if clean_user else cfg.EMAIL_FROM
                    server.sendmail(sender_addr, [recipient_email], msg.as_string())
                
                logger.info(f"Successfully dispatched OTP email via SMTP to {recipient_email}")
                return True
            except Exception as e:
                logger.error(f"SMTP dispatch failed: {e}")
                if not cfg.DEV_MODE:
                    raise e

        # Development / Fallback Mode
        log_entry = (
            f"[{datetime.now(timezone.utc).isoformat()}] DEV INBOX OTP DISPATCH\n"
            f"To: {recipient_email}\n"
            f"Subject: {subject}\n"
            f"OTP Code: {otp_code} (Expires in {expires_in})\n"
            f"------------------------------------------------------------\n"
        )
        logger.info(f"\n==================== [FinOS DEV EMAIL INBOX] ====================\n{log_entry}=================================================================")
        
        try:
            with open(DEV_INBOX_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(log_entry)
        except Exception as file_err:
            logger.warning(f"Could not append to dev_inbox.log: {file_err}")

        return True

email_service = EmailService()
