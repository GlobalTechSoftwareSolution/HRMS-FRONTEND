"use client";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-black">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center text-xl select-none">
              HR
            </div>
            <span className="text-xl font-semibold tracking-wide">HRMS</span>
          </div>
          <ul className="flex space-x-8 text-gray-700 font-medium">
            <li>
              <a href="#" className="hover:text-blue-600 transition-colors">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-blue-600 transition-colors">
                About
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-blue-600 transition-colors">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </nav>

      {/* Main content with welcome message centered */}
      <main className="flex-grow flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl font-bold text-blue-700 mb-6">Welcome to HRMS</h1>
        <a
          href="/login"
          className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-semibold"
        >
          Go to Login
        </a>
      </main>

      {/* Footer */}
      <footer className="bg-white shadow-inner mt-12">
        <div className="container mx-auto px-6 py-6 text-center text-gray-600 text-sm">
          <p>© 2024 HRMS. All rights reserved.</p>
          <p>
            Contact us:{" "}
            <a
              href="mailto:support@hrms.com"
              className="text-blue-600 hover:underline"
            >
              support@hrms.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}