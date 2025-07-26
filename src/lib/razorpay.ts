 import Razorpay from 'razorpay';
 const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_Razorpay_PUBLISHABLE_KEY!,
    key_secret: process.env.Razorpay_secret_key!,
  });
  export default razorpay;