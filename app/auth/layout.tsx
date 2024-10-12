"use client";

import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      {children}
    </div>
  );
};

export default AuthLayout;
