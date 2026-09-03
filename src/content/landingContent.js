export const hero = {
  eyebrow: "AI-Powered Loan Application",
  title: "Apply for your loan, guided every step of the way",
  subtitle:
    "Apply for your loan quickly with an intelligent assistant that guides you through every step of the application process.",
  estimate: "5 minutes",
  primaryCta: "Start Application",
  secondaryCta: "Learn More",
  trustBadges: ["Secure", "Encrypted", "AI Assisted"],
};

export const about = {
  title: "What this application does",
  paragraphs: [
    "This application helps you complete your loan application through a guided experience.",
    "Our AI assistant simplifies the process by helping you complete each section and automatically extracting details from supported identity documents.",
    "The goal is to reduce manual effort while making the application faster and easier.",
  ],
};

// Only real, implemented capabilities — never claim more than this.
export const aiFeatures = [
  {
    title: "Automatic Aadhaar Extraction",
    description: "Upload your Aadhaar and the relevant details are read automatically, so you don't have to type them in.",
  },
  {
    title: "Automatic PAN Extraction",
    description: "Upload your PAN and the relevant details are read automatically, so you don't have to type them in.",
  },
  {
    title: "AI Guidance",
    description: "A floating assistant explains what each field means and why it's needed, right where you're working.",
  },
  {
    title: "Step-by-Step Assistance",
    description: "Clear guidance through every stage of the application, from loan details to e-signature.",
  },
  {
    title: "Secure Verification",
    description: "Your identity and documents are verified through an encrypted process before a decision is made.",
  },
  {
    title: "Application Progress Tracking",
    description: "A live progress indicator shows exactly where you are and how much is left.",
  },
];

export const documents = [
  { title: "Aadhaar", note: "Automatic extraction", required: true },
  { title: "PAN", note: "Automatic extraction", required: true },
  { title: "Salary Slip", note: "Manual upload", required: true },
  { title: "Bank Statement", note: "If required", required: false },
];

export const whyChooseUs = [
  { title: "Secure", description: "Your data is encrypted at every step of the journey." },
  { title: "Simple", description: "A guided, uncluttered experience with no unnecessary steps." },
  { title: "Transparent", description: "You always know what's required and why." },
  { title: "AI Assisted", description: "Guidance and document extraction, without the manual busywork." },
  { title: "Fast", description: "Most applicants finish in under ten minutes." },
  { title: "Reliable", description: "A consistent process from application to disbursement." },
];

export const faq = [
  {
    question: "How long does it take?",
    answer: "Most applicants complete the application in about 5 minutes, plus a short verification and decision time.",
  },
  {
    question: "Is my information secure?",
    answer: "Yes. Your data is encrypted, and documents are used only to verify and process your application.",
  },
  {
    question: "Which documents are required?",
    answer: "Aadhaar and PAN are required and can be extracted automatically. A salary slip is also required, uploaded manually. A bank statement may be requested if needed.",
  },
  {
    question: "Can I save and continue later?",
    answer: "Yes. Your in-progress application is saved on this device, so refreshing or coming back later picks up where you left off.",
  },
  {
    question: "How does AI help me?",
    answer: "The AI assistant guides you through each step, explains what's being asked and why, and automatically extracts your details from Aadhaar and PAN so you don't have to type them in.",
  },
];

export const finalCta = {
  title: "Ready to Apply?",
  subtitle: "Start your application in just a few minutes.",
  cta: "Start Application",
};
