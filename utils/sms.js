import axios from 'axios';

export const sendOTPSms = async (phone, otp) => {
  // Development mode — console me print karo
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📱 OTP for ${phone}: ${otp}`);
    return true;
  }

  try {
    const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
      params: {
        authorization: process.env.FAST2SMS_API_KEY,
        variables_values: otp,
        route: 'otp',
        numbers: phone,
      },
    });
    return response.data.return === true;
  } catch (err) {
    console.error('SMS Error:', err.message);
    return false;
  }
};

export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
