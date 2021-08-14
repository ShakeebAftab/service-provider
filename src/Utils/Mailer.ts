import { createTransport } from 'nodemailer'

export const SendVerificationMail = async (email: string, code: number) => {

  const transporter = createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAILEMAIL,
      pass: process.env.GMAILPASSWORD
    }
  })

  transporter.sendMail({
    from: process.env.GMAILEMAIL,
    to: email,
    subject: 'APPNAME: Verification Code',
    html: `
      <h3>Thank You for signing up for our app<h3/>
      <p>Your verification code is: ${code}<p/>
      <p>This code is valid for 5 minutes<p/>
    `
  }, (err) => {
    if (err) {
      console.log(err.message)
    }
  })

}