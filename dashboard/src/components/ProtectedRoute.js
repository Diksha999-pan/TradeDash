
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  // If token not found, redirect to login
  if (!token) {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    window.location.href = "http://localhost:3000/login";;
  }
  return children;
};

export default ProtectedRoute;
