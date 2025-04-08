import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Navbar() {
    return (
        <header className="bg-white border-b shadow-sm">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="text-lg font-bold">
                    <Link href="/">UnlimCloud</Link>
                </div>
                <nav className="space-x-4">
                    <Link
                        href="/gallery"
                        className={cn(
                            "text-sm font-medium text-gray-700 hover:text-gray-900"
                        )}
                    >
                        Gallery
                    </Link>
                    <Link
                        href="/upload"
                        className={cn(
                            "text-sm font-medium text-gray-700 hover:text-gray-900"
                        )}
                    >
                        Upload
                    </Link>
                </nav>
            </div>
        </header>
    );
}

export default Navbar;