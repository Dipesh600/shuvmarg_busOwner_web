export interface OperatorFAQItem {
  id: string;
  category: "My Bus & Verification" | "Routes & Trips" | "Money & Bank Payouts" | "Tickets & Passengers";
  question: string;
  answer: string;
}

export const OPERATOR_FAQS: OperatorFAQItem[] = [
  {
    id: "kyc-1",
    category: "My Bus & Verification",
    question: "How long does account verification take?",
    answer: "Our team usually reviews your documents (Company Registration, PAN, and Citizenship) within 1 to 2 business days. You will get an SMS as soon as your account is approved.",
  },
  {
    id: "kyc-2",
    category: "My Bus & Verification",
    question: "What documents do I need to add a bus?",
    answer: "You need clear photos of your Bluebook (registration), valid Route Permit, Bus Insurance, and Fitness Certificate. You can upload them from the Fleet section.",
  },
  {
    id: "finance-1",
    category: "Money & Bank Payouts",
    question: "When do I receive my ticket money in my bank account?",
    answer: "Your ticket earnings are sent automatically to your registered bank account every Tuesday and Friday. You can check all payments anytime in the Finance tab.",
  },
  {
    id: "finance-2",
    category: "Money & Bank Payouts",
    question: "How do I change my bank account number?",
    answer: "For security, send us a quick message here with a photo of your cheque or bank letter. We will verify and update your account within 24 hours.",
  },
  {
    id: "routes-1",
    category: "Routes & Trips",
    question: "How do I create a new bus route?",
    answer: "Go to the Routes tab in your dashboard, select where your bus starts and ends, choose your bus, and set your departure time. You can make it run daily or on specific days.",
  },
  {
    id: "routes-2",
    category: "Routes & Trips",
    question: "What should I do if my bus breaks down or is delayed?",
    answer: "Call our 24/7 support line (+977-1-5970000) immediately. We will automatically notify all booked passengers via SMS so there is no confusion at the counter.",
  },
  {
    id: "bookings-1",
    category: "Tickets & Passengers",
    question: "How does my conductor check passenger tickets?",
    answer: "Conductors can scan the QR code on the passenger's digital ticket using our mobile app, or simply check the passenger's name and phone number on the trip sheet.",
  },
  {
    id: "bookings-2",
    category: "Tickets & Passengers",
    question: "What happens if a trip is cancelled?",
    answer: "If a trip is cancelled due to road or mechanical issues, passengers get a full refund automatically. Our support team will also assist you in handling re-bookings.",
  },
];

export const FAQ_CATEGORIES = [
  "All",
  "My Bus & Verification",
  "Money & Bank Payouts",
  "Routes & Trips",
  "Tickets & Passengers",
] as const;
