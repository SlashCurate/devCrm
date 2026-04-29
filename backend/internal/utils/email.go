package utils

import (
	"fmt"
	"net/smtp"
	"os"
)

func SendEmail(to, subject, body string) error {
	from := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")

	auth := smtp.PlainAuth("", from, pass, host)
	msg := fmt.Sprintf("From: %s\nTo: %s\nSubject: %s\nMIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n%s",
		from, to, subject, body)

	return smtp.SendMail(host+":"+port, auth, from, []string{to}, []byte(msg))
}

func SendPasswordResetEmail(to, token string) error {
	appURL := os.Getenv("APP_URL")
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", appURL, token)
	subject := "Password Reset Request - University ERP"
	body := fmt.Sprintf(`
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="%s">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you did not request this, please ignore this email.</p>
    `, resetLink)
	return SendEmail(to, subject, body)
}

func SendWelcomeEmail(to, name, role string) error {
	subject := "Welcome to University ERP"
	body := fmt.Sprintf(`
        <h2>Welcome, %s!</h2>
        <p>Your account has been created successfully as <strong>%s</strong>.</p>
        <p>You can now login to the University ERP portal.</p>
    `, name, role)
	return SendEmail(to, subject, body)
}

func SendNotificationEmail(to, title, message string) error {
	subject := "Notification: " + title
	body := fmt.Sprintf(`<h3>%s</h3><p>%s</p>`, title, message)
	return SendEmail(to, subject, body)
}
