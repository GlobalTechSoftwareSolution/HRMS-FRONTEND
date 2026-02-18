"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export const Breadcrumbs: React.FC = () => {
    const pathname = usePathname();

    // Don't show breadcrumbs on the home page
    if (pathname === "/") return null;

    const pathSegments = pathname.split("/").filter((segment) => segment !== "");

    return (
        <nav className="flex px-4 py-3 text-gray-700 bg-gray-50/50 backdrop-blur-sm border-b border-gray-200 lg:hidden" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
                <li className="inline-flex items-center">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
                    >
                        <Home size={14} className="mr-2" />
                        Home
                    </Link>
                </li>
                {pathSegments.map((segment, index) => {
                    const href = `/${pathSegments.slice(0, index + 1).join("/")}`;
                    const isLast = index === pathSegments.length - 1;
                    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

                    return (
                        <li key={index}>
                            <div className="flex items-center">
                                <ChevronRight size={14} className="text-gray-400 mx-1" />
                                {isLast ? (
                                    <span className="text-sm font-bold text-blue-600 truncate max-w-[150px]">
                                        {label}
                                    </span>
                                ) : (
                                    <Link
                                        href={href}
                                        className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
                                    >
                                        {label}
                                    </Link>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};
