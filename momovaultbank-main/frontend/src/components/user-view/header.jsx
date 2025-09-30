import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { useContext, useState } from "react";
import PropTypes from "prop-types";
import { AuthContext } from "@/context/auth-context";
import { FaBars } from "react-icons/fa";

function StudentViewCommonHeader({ navItems, activeTab, onSelectTab }) {
  const navigate = useNavigate();
  const { resetCredentials, auth } = useContext(AuthContext);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          {Array.isArray(navItems) && navItems.length > 0 && (
            <div className="md:hidden relative">
              <button
                aria-label="Open menu"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="p-2 rounded-md border border-gray-200 hover:bg-gray-50 text-momoBlue"
              >
                <FaBars />
              </button>
              {mobileMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <nav className="py-1">
                    {navItems.map(({ id, icon: Icon, label }) => (
                      <button
                        key={id}
                        onClick={() => {
                          onSelectTab && onSelectTab(id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                          activeTab === id
                            ? "bg-momoBlue/10 text-momoBlue font-semibold"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {Icon ? <Icon /> : null}
                        <span>{label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              )}
            </div>
          )}
          <Link
            to={auth.user?.role === "admin" ? "/admin" : "/home"}
            className="flex items-center hover:text-black"
          >
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

StudentViewCommonHeader.propTypes = {
  navItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
    })
  ),
  activeTab: PropTypes.string,
  onSelectTab: PropTypes.func,
};

StudentViewCommonHeader.defaultProps = {
  navItems: [],
  activeTab: undefined,
  onSelectTab: undefined,
};
