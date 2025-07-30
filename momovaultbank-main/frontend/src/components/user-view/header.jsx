import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { useContext, useState } from "react";
import { AuthContext } from "@/context/auth-context";

function StudentViewCommonHeader() {
  const navigate = useNavigate();
  const { resetCredentials } = useContext(AuthContext);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleLogout() {
    resetCredentials();
    sessionStorage.clear();
    navigate("/");
  }

  return (
    <>
      <header className="flex items-center justify-between p-4 border-b bg-white relative z-50">
        {/* Left: Logo */}
        <div className="flex items-center gap-4">
          <Link to="/home" className="flex items-center hover:text-black">
            <img
              src="/momobank.png"
              alt="Logo"
              className="h-12 w-20  object-cover"
            />
            <span className="flex items-center gap-2 text-2xl font-bold text-momoYellow">
              Mo Pocket
            </span>
          </Link>
        </div>

        {/* Right: Always show Sign Out button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setShowConfirm(true)}
            className="text-sm md:text-base bg-purple"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-momoYellow rounded-lg shadow-lg p-6 w-[90%] max-w-md text-center">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Are you sure you want to sign out?
            </h2>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="bg-purple px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2"
              >
                Yes, Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default StudentViewCommonHeader;
