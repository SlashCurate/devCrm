import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, FileText, Download, Calendar, AlertCircle, User, IndianRupee, RefreshCw, XCircle } from "lucide-react";
import api from "../../api/axios";
import toast from "react-hot-toast";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  //const location = useLocation();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [applicationDetails, setApplicationDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [daysLeft, setDaysLeft] = useState<number | null>(null);

  // Extract payment and application data from location state or sessionStorage
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const applicationId = sessionStorage.getItem("registeredApplicantId") || "";
        const email = sessionStorage.getItem("registeredEmail") || "";

        // Fetch payment details
        const paymentRes = await api.get(`/auth/application-status?application_id=${applicationId}`);
        setPaymentDetails(paymentRes.data.data);

        // Fetch application details
        const appRes = await api.get(`/auth/application-status?application_id=${applicationId}&email=${email}`);
        setApplicationDetails(appRes.data.data);

        // Calculate days left for document verification (15 days before admission deadline)
        if (appRes.data.data?.cycle?.application_end_date) {
          const endDate = new Date(appRes.data.data.cycle.application_end_date);
          const today = new Date();
          const fifteenDaysBefore = new Date(endDate);
          fifteenDaysBefore.setDate(endDate.getDate() - 15);
          const diffTime = fifteenDaysBefore.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysLeft(diffDays);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load details");
        toast.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, []);

  // Download receipt as PDF
  const downloadReceipt = () => {
    const receiptData = {
      paymentId: paymentDetails?.payment_id,
      applicationId: applicationDetails?.application_id,
      candidateName: `${applicationDetails?.first_name} ${applicationDetails?.last_name}`,
      email: applicationDetails?.email,
      phone: applicationDetails?.phone,
      amount: paymentDetails?.amount,
      date: new Date(paymentDetails?.paid_at).toLocaleDateString("en-IN"),
      program: applicationDetails?.program?.name,
      college: applicationDetails?.college?.name,
    };

    const receiptContent = `
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .details { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
            th { background-color: #f2f2f2; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>S University</h2>
            <p>Application Fee Payment Receipt</p>
          </div>
          <div class="details">
            <table>
              <tr><th>Payment ID</th><td>${receiptData.paymentId}</td></tr>
              <tr><th>Application ID</th><td>${receiptData.applicationId}</td></tr>
              <tr><th>Candidate Name</th><td>${receiptData.candidateName}</td></tr>
              <tr><th>Email</th><td>${receiptData.email}</td></tr>
              <tr><th>Phone</th><td>${receiptData.phone}</td></tr>
              <tr><th>Program</th><td>${receiptData.program}</td></tr>
              <tr><th>College</th><td>${receiptData.college}</td></tr>
              <tr><th>Amount Paid</th><td>₹${receiptData.amount?.toLocaleString()}</td></tr>
              <tr><th>Payment Date</th><td>${receiptData.date}</td></tr>
            </table>
          </div>
          <div class="footer">
            <p>Thank you for your payment. Please visit the college for document verification at least 15 days before the admission deadline.</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([receiptContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Payment_Receipt_${receiptData.applicationId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Receipt downloaded!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={() => navigate("/applicant/dashboard")}
            className="btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Successful!</h1>
            <p className="text-gray-500 mt-2">
              Your application fee has been successfully paid.
            </p>
          </div>

          {/* Payment and Application Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <IndianRupee className="w-5 h-5" /> Payment Details
              </h2>
              <div className="space-y-2">
                <p>
                  <span className="text-gray-500">Payment ID:</span>{" "}
                  <span className="font-semibold">{paymentDetails?.payment_id}</span>
                </p>
                <p>
                  <span className="text-gray-500">Amount:</span>{" "}
                  <span className="font-semibold">₹{paymentDetails?.amount?.toLocaleString()}</span>
                </p>
                <p>
                  <span className="text-gray-500">Date:</span>{" "}
                  <span className="font-semibold">
                    {new Date(paymentDetails?.paid_at).toLocaleDateString("en-IN")}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Method:</span>{" "}
                  <span className="font-semibold">{paymentDetails?.method || "Online"}</span>
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Application Details
              </h2>
              <div className="space-y-2">
                <p>
                  <span className="text-gray-500">Application ID:</span>{" "}
                  <span className="font-semibold">{applicationDetails?.application_id}</span>
                </p>
                <p>
                  <span className="text-gray-500">Program:</span>{" "}
                  <span className="font-semibold">{applicationDetails?.program?.name}</span>
                </p>
                <p>
                  <span className="text-gray-500">College:</span>{" "}
                  <span className="font-semibold">{applicationDetails?.college?.name}</span>
                </p>
                <p>
                  <span className="text-gray-500">Status:</span>{" "}
                  <span className="font-semibold text-green-600">Paid</span>
                </p>
              </div>
            </div>
          </div>

          {/* Candidate Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" /> Candidate Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <p>
                <span className="text-gray-500">Name:</span>{" "}
                <span className="font-semibold">
                  {applicationDetails?.first_name} {applicationDetails?.last_name}
                </span>
              </p>
              <p>
                <span className="text-gray-500">Email:</span>{" "}
                <span className="font-semibold">{applicationDetails?.email}</span>
              </p>
              <p>
                <span className="text-gray-500">Phone:</span>{" "}
                <span className="font-semibold">{applicationDetails?.phone}</span>
              </p>
              <p>
                <span className="text-gray-500">Category:</span>{" "}
                <span className="font-semibold">{applicationDetails?.category}</span>
              </p>
            </div>
          </div>

          {/* Download Receipt Button */}
          <div className="text-center mb-6">
            <button
              onClick={downloadReceipt}
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-md"
            >
              <Download className="w-5 h-5" /> Download Receipt
            </button>
          </div>
        </div>

        {/* Document Verification Reminder */}
        {daysLeft !== null && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-800 mb-1">Document Verification Reminder</h3>
                <p className="text-amber-700 text-sm">
                  You must visit the college to verify your documents <strong>at least 15 days before the admission deadline</strong>.
                  {daysLeft > 0 ? (
                    <span> You have <strong>{daysLeft} days</strong> left to complete this step.</span>
                  ) : (
                    <span className="text-red-600"> The deadline for document verification has passed. Please contact the admissions office immediately.</span>
                  )}
                </p>
                <p className="text-amber-700 text-sm mt-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Admission Deadline: {new Date(applicationDetails?.cycle?.application_end_date).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="mt-6 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Next Steps</h3>
          <p className="text-gray-600 text-sm">
            1. Download and save your payment receipt. <br />
            2. Visit the college for document verification. <br />
            3. Check your email for further updates.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => navigate("/applicant/dashboard")}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Print Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}