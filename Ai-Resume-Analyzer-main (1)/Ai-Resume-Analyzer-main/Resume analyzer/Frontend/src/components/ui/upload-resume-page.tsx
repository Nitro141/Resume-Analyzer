"use client";

import React, { useState } from 'react';
import { ArrowLeft, Loader2, UploadCloud, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface UploadResumePageProps {
    onBack: () => void;
}

export default function UploadResumePage({ onBack }: UploadResumePageProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== "application/pdf") {
                setError("Only PDF files are allowed.");
                setFile(null);
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError("File size must be less than 5MB.");
                setFile(null);
                return;
            }
            setFile(selectedFile);
            setError(null);
            setSuccess(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        try {
            // Get auth token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError("Not authenticated. Please sign in again.");
                setUploading(false);
                return;
            }

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("http://localhost:8000/profile/resume", {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || "Upload failed.");
            } else {
                setSuccess(`Resume saved to profile: ${data.filename}`);
                setFile(null); // Clear input on success
            }
        } catch (err) {
            setError("Failed to connect to server.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-neutral-950 p-6 overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-8 max-w-2xl mx-auto w-full">
                <Button variant="ghost" onClick={onBack} className="gap-2 pl-0 hover:bg-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
            </div>

            <div className="flex-1 flex flex-col items-center max-w-2xl mx-auto w-full space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Upload Profile Resume</h1>
                    <p className="text-neutral-500 dark:text-neutral-400">
                        Upload your resume once and reuse it for analysis, optimization, and job matching.
                    </p>
                </div>

                <Card className="w-full border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-indigo-500" />
                            Drag & Drop Resume
                        </CardTitle>
                        <CardDescription>PDF only, max 5MB</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-200">
                                <AlertCircle className="h-4 w-4" /> {error}
                            </motion.div>
                        )}

                        {success && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-lg flex items-center gap-2 border border-emerald-200">
                                <CheckCircle className="h-4 w-4" /> {success}
                            </motion.div>
                        )}

                        <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-10 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors text-center cursor-pointer relative">
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileChange}
                                accept="application/pdf"
                            />
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-2">
                                    <UploadCloud className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                {file ? (
                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
                                        <FileText className="h-5 w-5" />
                                        {file.name}
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-200">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-sm text-neutral-500">
                                            PDF (up to 5MB)
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        <Button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-base shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving to Profile...
                                </>
                            ) : (
                                "Save Resume to Profile"
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
