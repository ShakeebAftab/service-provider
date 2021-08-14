import { createTransport } from 'nodemailer'

export const SendVerificationMail = (email: string, code: number, verification: boolean) => {

  const transporter = createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAILEMAIL,
      pass: process.env.GMAILPASSWORD
    }
  })

  const html = verification ? 
    `
      <h3>Thank You for signing up for our app<h3/>
      <p>Your verification code is: ${code}<p/>
      <p>This code is valid for 5 minutes<p/>
    ` : 
    ` <h3>Forgot you password?<h3/>
      <p>No worries, please use the following code to reset your password: ${code}<p/>
      <p>This code is valid for 5 minutes<p/>
    `

  transporter.sendMail({
    from: process.env.GMAILEMAIL,
    to: email,
    subject: 'APPNAME: Verification Code',
    html
  }, (err) => {
    if (err) {
      console.log(err.message)
    }
  })

}