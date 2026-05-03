"use client";

import React from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function Navigation() {
    const { data: session, isPending } = authClient.useSession();
    const router = useRouter();

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/sign-in");
                }
            }
        });
    };

    const role = session ? (session.user as any).role : null;

    return (
        <nav style={{
            padding: "0 24px",
            height: "64px",
            background: "#ffffff",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 50,
            backdropFilter: "blur(12px)",
        }}>
            <div style={{
                maxWidth: "1200px",
                width: "100%",
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
            }}>
                <Link href="/" style={{ textDecoration: "none" }}>
                    <span style={{ fontSize: "22px", fontWeight: 700, color: "#18181b", letterSpacing: "-0.02em" }}>
                        Mid<span style={{ color: "#3b82f6" }}>Care</span>
                    </span>
                </Link>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {isPending ? (
                        <div style={{ height: "36px", width: "80px", background: "#f4f4f5", borderRadius: "8px", animation: "pulse 1.5s ease-in-out infinite" }} />
                    ) : session ? (
                        <>
                            {/* Role-aware navigation links */}
                            {role === "PATIENT" && (
                                <Link href="/book" style={navLinkStyle}>
                                    Book Appointment
                                </Link>
                            )}
                            {role === "DOCTOR" && (
                                <>
                                    <Link href="/dashboard" style={navLinkStyle}>
                                        Dashboard
                                    </Link>
                                    <Link href="/schedule" style={navLinkStyle}>
                                        Schedule
                                    </Link>
                                </>
                            )}
                            {role === "ADMIN" && (
                                <Link href="/admin/dashboard" style={navLinkStyle}>
                                    Analytics
                                </Link>
                            )}

                            <div style={{ width: "1px", height: "24px", background: "#e4e4e7", margin: "0 8px" }} />

                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#18181b", lineHeight: 1.3 }}>
                                        {session.user.name}
                                    </div>
                                    <div style={{ fontSize: "11px", color: "#a1a1aa", textTransform: "capitalize" }}>
                                        {role?.toLowerCase()}
                                    </div>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    style={{
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        color: "#71717a",
                                        padding: "7px 14px",
                                        borderRadius: "8px",
                                        border: "1px solid #e4e4e7",
                                        background: "#fff",
                                        cursor: "pointer",
                                        transition: "all 0.15s ease",
                                    }}
                                >
                                    Sign Out
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/sign-in" style={navLinkStyle}>
                                Sign In
                            </Link>
                            <Link
                                href="/sign-up"
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#fff",
                                    padding: "8px 18px",
                                    borderRadius: "8px",
                                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                                    textDecoration: "none",
                                    boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                                    transition: "all 0.15s ease",
                                }}
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

const navLinkStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 500,
    color: "#52525b",
    padding: "7px 14px",
    borderRadius: "8px",
    textDecoration: "none",
    transition: "all 0.15s ease",
};
