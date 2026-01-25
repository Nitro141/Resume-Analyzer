"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Download, RefreshCw, Wand2, FileText, AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";

interface BuilderPageProps {
    onBack: () => void;
}

interface GeneratedResume {
    ats_score: number;
    resume_text: string;
    skills_match_percentage: number;
    missing_skills: string[];
    optimization_notes: string[];
}

export default function BuilderPage({ onBack }: BuilderPageProps) {
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<GeneratedResume | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [hasProfileResume, setHasProfileResume] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        phone: "",
        location: "",
        target_job_title: "",
        years_of_experience: "",
        skills: "",
        work_experience: "",
        education: "",
        projects: "",
        certifications: "",
        job_description: ""
    });

    // Check if profile resume exists on mount
    useEffect(() => {
        const checkProfileResume = async () => {
            try {
                // Get auth token
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const response = await fetch("http://localhost:8000/profile/resume", {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                const data = await response.json();
                setHasProfileResume(data.exists);
            } catch (err) {
                console.error("Failed to check profile resume:", err);
            }
        };
        checkProfileResume();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGenerate = async () => {
        if (!formData.full_name || !formData.target_job_title || !formData.skills || !formData.work_experience || !formData.education || formData.job_description.length < 50) {
            setError("Please fill in all required fields and ensure Job Description is at least 50 chars.");
            return;
        }

        setGenerating(true);
        setError(null);

        const payload = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            payload.append(key, value);
        });

        try {
            const response = await fetch("http://localhost:8000/generate_resume", {
                method: "POST",
                body: payload,
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || data.error || "Generation failed.");
            } else {
                setResult(data);
            }
        } catch (err) {
            setError("Failed to connect to server.");
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadPDF = () => {
        if (!result) return;
        const doc = new jsPDF();

        // Simple text dump for PDF (Proof of Concept)
        // Ideally use html2canvas or advanced pdf lib for layout
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(result.resume_text, 180);
        doc.text(splitText, 15, 15);
        doc.save(`${formData.full_name.replace(/\s+/g, '_')}_Resume.pdf`);
    };

    const handleSaveToProfile = async () => {
        if (!result) return;

        // If profile resume exists, show confirmation dialog
        if (hasProfileResume) {
            setShowConfirmDialog(true);
            return;
        }

        // Otherwise, save directly
        await saveResumeToProfile();
    };

    const saveResumeToProfile = async () => {
        setSaving(true);
        setError(null);

        try {
            // Get auth token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError("Not authenticated. Please sign in again.");
                setSaving(false);
                return;
            }

            // Generate PDF blob
            const doc = new jsPDF();
            doc.setFontSize(12);
            const splitText = doc.splitTextToSize(result!.resume_text, 180);
            doc.text(splitText, 15, 15);
            const pdfBlob = doc.output('blob');

            // Create form data
            const formDataToSend = new FormData();
            const fileName = `${formData.full_name.replace(/\s+/g, '_')}_Resume.pdf`;
            formDataToSend.append('file', pdfBlob, fileName);

            // Upload to backend with auth token
            const response = await fetch("http://localhost:8000/profile/resume", {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: formDataToSend,
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.detail || "Failed to save resume to profile");
            } else {
                setHasProfileResume(true);
                alert("Resume saved to profile successfully!");
            }
        } catch (err) {
            setError("Failed to save resume to profile");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-neutral-950 p-6 overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Button variant="ghost" onClick={onBack} className="gap-2 pl-0 hover:bg-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200">
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    AI Resume Architect
                </h1>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto w-full">

                {/* LEFT: Input Form */}
                <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm h-fit">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wand2 className="h-5 w-5 text-indigo-500" />
                            Resume Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" /> {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <input name="full_name" placeholder="Full Name *" className="p-2 border rounded-md dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm" onChange={handleChange} />
                            <input name="email" placeholder="Email *" className="p-2 border rounded-md dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm" onChange={handleChange} />
                            <input name="phone" placeholder="Phone" className="p-2 border rounded-md dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm" onChange={handleChange} />
                            <input name="location" placeholder="Location (City, Country)" className="p-2 border rounded-md dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm" onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <input name="target_job_title" placeholder="Target Job Title *" className="p-2 border rounded-md dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm" onChange={handleChange} />
                            <input name="years_of_experience" placeholder="Years of Exp (e.g. 5)" className="p-2 border rounded-md dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm" onChange={handleChange} />
                        </div>

                        <textarea name="skills" placeholder="Skills (comma separated) *" className="w-full p-2 border rounded-md dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm min-h-[60px]" onChange={handleChange} />
                        <textarea name="work_experience" placeholder="Work Experience (Paste your raw history) *" className="w-full p-2 border rounded-md dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm min-h-[100px]" onChange={handleChange} />
                        <textarea name="education" placeholder="Education *" className="w-full p-2 border rounded-md dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm min-h-[60px]" onChange={handleChange} />

                        <div className="grid grid-cols-2 gap-4">
                            <textarea name="projects" placeholder="Projects (Optional)" className="w-full p-2 border rounded-md dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm min-h-[60px]" onChange={handleChange} />
                            <textarea name="certifications" placeholder="Certifications (Optional)" className="w-full p-2 border rounded-md dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-sm min-h-[60px]" onChange={handleChange} />
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
                            <label className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-2 block">
                                Target Job Description (Critical for ATS)
                            </label>
                            <textarea
                                name="job_description"
                                placeholder="Paste the full job description here (min 50 chars)..."
                                className="w-full p-2 border rounded-md dark:bg-neutral-900 border-indigo-200 dark:border-indigo-800 text-sm min-h-[120px] focus:ring-2 focus:ring-indigo-500"
                                onChange={handleChange}
                            />
                        </div>

                        <Button onClick={handleGenerate} disabled={generating} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
                            {generating ? <span className="flex items-center gap-2"><Loader2 className="animate-spin h-4 w-4" /> Optimizing Profile...</span> : <span className="flex items-center gap-2"><Wand2 className="h-4 w-4" /> Generate Turnkey Resume</span>}
                        </Button>
                    </CardContent>
                </Card>

                {/* RIGHT: Output Preview */}
                <div className="space-y-6">
                    {result ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col gap-6">

                            {/* Score Card */}
                            <div className="grid grid-cols-2 gap-4">
                                <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-800">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                        <span className="text-4xl font-bold text-emerald-700 dark:text-emerald-400">{result.ats_score}</span>
                                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">ATS Compatibility</span>
                                    </CardContent>
                                </Card>
                                <Card className="border-neutral-200 dark:border-neutral-800">
                                    <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                        <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{result.skills_match_percentage}%</span>
                                        <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">Skills Match</span>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Resume Paper Preview */}
                            <div className="bg-white text-black p-8 shadow-2xl rounded-sm min-h-[600px] font-serif text-sm leading-relaxed whitespace-pre-wrap border border-neutral-200">
                                {result.resume_text}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4">
                                <Button onClick={handleDownloadPDF} className="flex-1 bg-neutral-900 text-white hover:bg-neutral-800 h-12">
                                    <Download className="mr-2 h-4 w-4" /> Download PDF
                                </Button>
                                <Button
                                    onClick={handleSaveToProfile}
                                    disabled={saving}
                                    className="flex-1 bg-indigo-600 text-white hover:bg-indigo-700 h-12"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" /> Save to Profile
                                        </>
                                    )}
                                </Button>
                                <Button variant="outline" onClick={handleGenerate} disabled={generating} className="h-12 border-neutral-300">
                                    <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                                </Button>
                            </div>

                            {/* Confirmation Dialog */}
                            <ConfirmDialog
                                isOpen={showConfirmDialog}
                                onClose={() => setShowConfirmDialog(false)}
                                onConfirm={saveResumeToProfile}
                                title="Replace Existing Resume?"
                                message="You already have a resume saved in your profile. Do you want to replace it with this newly created one?"
                                confirmText="Yes, Replace"
                                cancelText="No, Keep Current"
                                variant="warning"
                            />

                            {/* Missing Skills Warning */}
                            {result.missing_skills?.length > 0 && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                                    <p className="font-bold flex items-center gap-2 mb-2"><AlertCircle className="h-4 w-4" /> Missing Keywords Detected:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {result.missing_skills.map(s => <span key={s} className="px-2 py-1 bg-white border border-amber-300 rounded text-xs">{s}</span>)}
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-neutral-400 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/50 min-h-[600px]">
                            <FileText className="h-16 w-16 mb-4 opacity-50" />
                            <p className="font-medium">Your optimized resume will appear here</p>
                            <p className="text-sm opacity-70 mt-2 max-w-xs text-center">Fill out the form to generate a tailored, ATS-ready resume in seconds.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
