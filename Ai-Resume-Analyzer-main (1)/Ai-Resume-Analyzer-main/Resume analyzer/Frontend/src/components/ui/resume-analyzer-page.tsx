"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Upload,
    FileText,
    AlertCircle,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Loader2,
    ArrowLeft,
    Briefcase,
    Check,
    X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from '@/lib/utils';

interface ATSAnalysisResult {
    ats_score: number;
    section_scores: {
        parsing: number;
        skills: number;
        experience: number;
        role_alignment: number;
        education: number;
    };
    skills_match_percentage: number;
    missing_skills: string[];
    strengths: string[];
    weaknesses: string[];
    ats_warnings: string[];
    improvement_suggestions: string[];
    final_verdict: "Strong Match" | "Moderate Match" | "Weak Match";
    error?: string;
}

const CircularProgress = ({ score, color = "text-emerald-500" }: { score: number; color?: string }) => {
    const radius = 60;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
        <div className="flex items-center justify-center relative w-40 h-40">
            <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
                <circle
                    stroke="#e5e7eb"
                    strokeWidth={stroke}
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <motion.circle
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    strokeLinecap="round"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className={color}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold text-neutral-800 dark:text-neutral-100">{score}</span>
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mt-1">ATS Score</span>
            </div>
        </div>
    );
};

const SectionScoreCard = ({ title, score, maxScore }: { title: string; score: number; maxScore: number }) => {
    const percentage = (score / maxScore) * 100;
    return (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{title}</span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">{score}/{maxScore}</span>
            </div>
            <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={cn("h-full rounded-full",
                        percentage >= 80 ? "bg-emerald-500" : percentage >= 60 ? "bg-amber-500" : "bg-rose-500"
                    )}
                />
            </div>
        </div>
    );
}

const ProgressBar = ({ label, value, color }: { label?: string; value: number; color?: string }) => (
    <div className="w-full">
        {label && (
            <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{label}</span>
                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-200">{value}%</span>
            </div>
        )}
        <div className="h-2.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className={cn("h-full rounded-full", color || "bg-blue-600")}
            />
        </div>
    </div>
);

interface ResumeAnalyzerPageProps {
    onBack: () => void;
}

export default function ResumeAnalyzerPage({ onBack }: ResumeAnalyzerPageProps) {
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<ATSAnalysisResult | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState("");
    const [error, setError] = useState<string | null>(null);


    const [resumeSource, setResumeSource] = useState<"upload" | "profile">("upload");
    const [profileResume, setProfileResume] = useState<{ exists: boolean; filename?: string; uploaded_at?: string } | null>(null);


    React.useEffect(() => {
        fetch("http://localhost:8000/profile/resume")
            .then(res => res.json())
            .then(data => {
                setProfileResume(data);
                if (data.exists) {
                    setResumeSource("profile");
                }
            })
            .catch(err => console.error("Failed to fetch profile resume", err));
    }, []);

    const handleAnalyze = async () => {

        if (resumeSource === "upload" && !file) {
            setError("Please upload a resume file.");
            return;
        }
        if (resumeSource === "profile" && !profileResume?.exists) {
            setError("No profile resume found. Please upload one in the Profile section or switch to 'Upload New Resume'.");
            return;
        }
        if (jobDescription.length < 50) {
            setError("Job description must be at least 50 characters.");
            return;
        }

        setAnalyzing(true);
        setError(null);
        setResults(null);

        const formData = new FormData();
        formData.append("job_description", jobDescription);
        formData.append("resume_source", resumeSource);

        if (resumeSource === "upload" && file) {
            formData.append("file", file);
        }

        try {
            const response = await fetch("http://localhost:8000/analyze_ats", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.detail || data.error || "Analysis failed on server.";
                setError(errorMsg);
                setResults(null);
            } else if (data.error) {
                setError(data.error);
                setResults(null);
            } else {
                setResults(data);
            }

        } catch (err) {
            console.error("Analysis failed:", err);
            setError("Failed to connect to the analysis server.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-emerald-500";
        if (score >= 60) return "text-amber-500";
        return "text-rose-500";
    };

    const isFormValid = (resumeSource === "profile" ? profileResume?.exists : file !== null) && jobDescription.length >= 50;

    return (
        <div className="min-h-full w-full bg-gray-50/50 dark:bg-neutral-950 p-6 md:p-8 overflow-y-auto">

            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col space-y-4">
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="w-fit -ml-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
                        <div>

                            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">ATS Resume Analyzer</h1>
                            <p className="text-neutral-500 dark:text-neutral-400 mt-2 max-w-xl">
                                Real-time analysis against Applicant Tracking System algorithms.
                                <br /><span className="text-amber-600 dark:text-amber-500 text-xs font-semibold">Requires Job Description & Valid Groq Cloud API Key.</span>
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-xl flex items-center gap-3"
                    >
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </motion.div>
                )}

                {!results && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid lg:grid-cols-2 gap-6"
                    >
                        <div className="space-y-6">

                            <div className="bg-white dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200 dark:border-neutral-800 flex">
                                <button
                                    onClick={() => setResumeSource("profile")}
                                    className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                                        resumeSource === "profile"
                                            ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-sm"
                                            : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                    )}
                                >
                                    <FileText className="h-4 w-4" /> Use Profile Resume
                                </button>
                                <button
                                    onClick={() => setResumeSource("upload")}
                                    className={cn("flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                                        resumeSource === "upload"
                                            ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-sm"
                                            : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                    )}
                                >
                                    <Upload className="h-4 w-4" /> Upload New PDF
                                </button>
                            </div>

                            {resumeSource === "profile" ? (
                                <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <FileText className="h-5 w-5 text-indigo-500" />
                                            Selected Resume
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {profileResume?.exists ? (
                                            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-xl flex flex-col items-center text-center">
                                                <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3">
                                                    <CheckCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{profileResume.filename}</p>
                                                <p className="text-xs text-neutral-500 mt-1">Uploaded on {profileResume.uploaded_at}</p>
                                                <div className="mt-4 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
                                                    Ready for Analysis
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                                                <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                                                <p className="font-medium text-neutral-900 dark:text-neutral-200">No Profile Resume Found</p>
                                                <p className="text-sm text-neutral-500 mt-1 mb-4">You haven't uploaded a resume to your profile yet.</p>
                                                <Button variant="outline" size="sm" onClick={() => setResumeSource("upload")}>
                                                    Upload One Now
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Upload className="h-5 w-5 text-neutral-500" />
                                            Upload Resume
                                        </CardTitle>
                                        <CardDescription>Supported formats: PDF, DOCX (Max 5MB)</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl p-8 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors text-center cursor-pointer relative">
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleFileChange}
                                                accept=".pdf,.docx,.doc"
                                            />
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-12 w-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-2">
                                                    <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                {file ? (
                                                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium">
                                                        <CheckCircle className="h-4 w-4" />
                                                        {file.name}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-200">
                                                            Click to upload or drag and drop
                                                        </p>
                                                        <p className="text-xs text-neutral-500">
                                                            ATS-friendly formats recommended
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div className="flex flex-col gap-6">
                            <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col flex-1">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Briefcase className="h-5 w-5 text-neutral-500" />
                                        Target Job Description
                                    </CardTitle>
                                    <CardDescription>Paste the job description (Min 50 chars)</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <textarea
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        className="w-full h-full min-h-[160px] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 resize-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-800 focus:outline-none text-sm"
                                        placeholder="Paste the full job description here..."
                                    />
                                    <div className="text-right mt-2 text-xs text-neutral-400">
                                        {jobDescription.length}/50 required
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-center">
                                <Button
                                    size="lg"
                                    onClick={handleAnalyze}
                                    disabled={analyzing || !isFormValid}
                                    className="w-full h-12 text-base font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {analyzing ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing via Groq AI...
                                        </>
                                    ) : (
                                        "Analyze Resume"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {results && !analyzing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-8"
                    >
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card className="md:col-span-1 border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center py-8">
                                <CircularProgress score={results.ats_score} color={getScoreColor(results.ats_score)} />
                                <div className="mt-4 text-center">
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{results.final_verdict}</h3>
                                    <p className="text-sm text-neutral-500">Based on standard ATS parsing rules</p>
                                </div>
                            </Card>

                            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <SectionScoreCard title="Parsing Compatibility" score={results.section_scores?.parsing || 0} maxScore={20} />
                                <SectionScoreCard title="Skills Match" score={results.section_scores?.skills || 0} maxScore={35} />
                                <SectionScoreCard title="Experience Relevance" score={results.section_scores?.experience || 0} maxScore={25} />
                                <SectionScoreCard title="Role Alignment" score={results.section_scores?.role_alignment || 0} maxScore={10} />
                                <SectionScoreCard title="Education" score={results.section_scores?.education || 0} maxScore={10} />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base">Skills Analysis</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <ProgressBar label="Overall Match" value={results.skills_match_percentage} color="bg-emerald-500" />

                                    <div className="pt-4">
                                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-200 mb-3 flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-rose-500" /> Missing Critical Skills
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {(results.missing_skills || []).map(skill => (
                                                <span key={skill} className="px-3 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs font-medium rounded-full border border-rose-100 dark:border-rose-800">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm bg-amber-50/50 dark:bg-amber-950/10">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-amber-600" />
                                        ATS Compatibility Warnings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {(results.ats_warnings || []).map((warning, i) => (
                                        <div key={i} className="flex gap-3 items-start">
                                            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-sm text-neutral-700 dark:text-neutral-300">{warning}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-emerald-500" /> Strengths
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {(results.strengths || []).map((str, i) => (
                                            <li key={i} className="flex gap-2 items-start text-sm text-neutral-700 dark:text-neutral-300">
                                                <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                                {str}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <XCircle className="h-5 w-5 text-rose-500" /> Weaknesses
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {(results.weaknesses || []).map((weak, i) => (
                                            <li key={i} className="flex gap-2 items-start text-sm text-neutral-700 dark:text-neutral-300">
                                                <X className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                                {weak}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-neutral-200 dark:border-neutral-800 shadow-sm bg-indigo-50/30 dark:bg-indigo-900/10">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    Improvement Suggestions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3">
                                    {(results.improvement_suggestions || []).map((suggestion, i) => (
                                        <div key={i} className="flex gap-3 items-start p-3 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-100 dark:border-neutral-800">
                                            <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                                {i + 1}
                                            </div>
                                            <p className="text-sm text-neutral-700 dark:text-neutral-300">{suggestion}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-neutral-800 dark:to-neutral-900 p-6 text-white shadow-lg">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold">Final ATS Verdict: {results.final_verdict}</h3>
                                    <p className="text-neutral-400 text-sm">Based on scanning logic from Taleo, Greenhouse, and Lever compatibility rules.</p>
                                </div>
                                <div className={cn("flex items-center gap-3 px-4 py-2 rounded-lg border",
                                    results.final_verdict === "Strong Match"
                                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-200"
                                        : results.final_verdict === "Moderate Match"
                                            ? "bg-amber-500/20 border-amber-500/50 text-amber-200"
                                            : "bg-rose-500/20 border-rose-500/50 text-rose-200"
                                )}>
                                    {results.final_verdict === "Strong Match" ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                                    <span className="font-semibold">
                                        {results.final_verdict === "Strong Match" ? "Ready for Application" : "Optimizations Recommended"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
