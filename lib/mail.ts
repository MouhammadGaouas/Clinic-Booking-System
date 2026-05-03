import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: Number(process.env.SMTP_PORT) || 587,
  auth: { user: process.env.SMTP_USER || "user", pass: process.env.SMTP_PASS || "pass" },
});

export async function sendAppointmentConfirmation(to: string, data: {
  patientName: string;
  doctorName: string;
  dateTime: string;
  appointmentId: string;
}) {
  try {
      await transporter.sendMail({
        from: '"MidCare" <noreply@midcare.local>',
        to,
        subject: "Appointment Confirmed",
        html: `
          <h2>Appointment Confirmed</h2>
          <p>Hello ${data.patientName},</p>
          <p>Your appointment with <strong>${data.doctorName}</strong> is confirmed for <strong>${data.dateTime}</strong>.</p>
          <p>Reference: ${data.appointmentId}</p>
        `,
      });
  } catch (error) {
      console.error("Failed to send confirmation email", error);
  }
}

export async function sendAppointmentReminder(to: string, data: {
  patientName: string;
  doctorName: string;
  dateTime: string;
}) {
  try {
      await transporter.sendMail({
        from: '"MidCare" <noreply@midcare.local>',
        to,
        subject: "Appointment Reminder — Tomorrow",
        html: `
          <h2>Reminder</h2>
          <p>Hello ${data.patientName}, this is a reminder of your appointment with <strong>${data.doctorName}</strong> tomorrow at <strong>${data.dateTime}</strong>.</p>
        `,
      });
  } catch (error) {
      console.error("Failed to send reminder email", error);
  }
}
