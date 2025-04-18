import React from "react";

const Navbar = () => {
  return (
    <div className="flex flex-row  justify-between bg-teal-700 ">
      <img
        className="w-20 h-20 p-3"
        src="https://uskudar.edu.tr/template/app/dist/img/logo/yazisiz-logo.png"
      />
      <div className="flex p-3">
        <button class="bg-transparent hover:bg-teal-500 text-white font-semibold hover:text-white py-2 px-4 border border-transparent hover:border-transparent rounded m-2">
          student
        </button>
        <button class="bg-transparent hover:bg-teal-500 text-white font-semibold hover:text-white py-2 px-4 border border-transparent hover:border-transparent rounded m-2 ">
          Teacher
        </button>
        <button class="bg-transparent hover:bg-teal-500 text-white font-semibold hover:text-white py-2 px-4 border border-transparent hover:border-transparent rounded m-2 ">
          secretary
        </button>
        <button class="bg-transparent hover:bg-teal-500 text-white font-semibold hover:text-white py-2 px-4 border border-transparent hover:border-transparent rounded w-32 animate-bounce">
          Announcements
        </button>
      </div>
    </div>
  );
};

export default Navbar;
