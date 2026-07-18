"use client";

import React, { useState, KeyboardEvent } from "react";
import { Search, X, Users } from "lucide-react";
import { searchStudents, StudentSearchResult } from "@/lib/studentsApi";
import StudentCard from "./StudentCard";
import StudentProfileModal from "./StudentProfileModal";

const SUGGESTED_KEYWORDS = ["AIML", "Frontend", "Backend", "Python", "React", "DevOps"];

export default function StudentSearchPage() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const addKeyword = (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setKeywords((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setInputValue("");
  };

  const removeKeyword = (value: string) => {
    setKeywords((prev) => prev.filter((k) => k !== value));
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(inputValue);
    } else if (e.key === "Backspace" && !inputValue && keywords.length) {
      removeKeyword(keywords[keywords.length - 1]);
    }
  };

  const runSearch = async (activeKeywords: string[]) => {
    if (!activeKeywords.length) return;
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const data = await searchStudents(activeKeywords);
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchClick = () => {
    const pending = inputValue.trim();
    const finalKeywords = pending && !keywords.includes(pending) ? [...keywords, pending] : keywords;
    if (pending) {
      setKeywords(finalKeywords);
      setInputValue("");
    }
    runSearch(finalKeywords);
  };

  const handleSuggestedClick = (kw: string) => {
    if (keywords.includes(kw)) return;
    const next = [...keywords, kw];
    setKeywords(next);
    runSearch(next);
  };

  return (
    <div className="flex flex-col h-full bg-[#F9FAFB] p-8 lg:p-12 pb-24">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Find Students</h1>
        <p className="text-slate-500 mt-2 text-lg">
          Search StudLyf students by skill, tech stack, or keyword — ranked by GitHub activity and
          hackathon performance.
        </p>
      </div>

      {/* Search bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex items-center gap-2 flex-wrap px-2 py-1">
          <Search className="text-slate-400 shrink-0" size={20} />
          {keywords.map((kw) => (
            <span
              key={kw}
              className="flex items-center gap-1.5 bg-primary/10 text-primary text-sm font-semibold pl-3 pr-2 py-1.5 rounded-lg"
            >
              {kw}
              <button
                onClick={() => removeKeyword(kw)}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={keywords.length ? "Add another keyword…" : "Type a keyword, e.g. AIML, and press Enter"}
            className="flex-1 min-w-[180px] py-1.5 outline-none text-slate-800 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Suggested
            </span>
            {SUGGESTED_KEYWORDS.map((kw) => (
              <button
                key={kw}
                onClick={() => handleSuggestedClick(kw)}
                disabled={keywords.includes(kw)}
                className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {kw}
              </button>
            ))}
          </div>

          <button
            onClick={handleSearchClick}
            disabled={isLoading || (!keywords.length && !inputValue.trim())}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            {isLoading ? "Searching…" : "Search"}
          </button>
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      )}

      {!isLoading && hasSearched && results.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-slate-200 rounded-3xl border-dashed">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Users className="text-slate-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No students found</h3>
          <p className="text-slate-500 max-w-sm">
            No one matched those keywords yet. Try a broader skill or a different tech stack.
          </p>
        </div>
      )}

      {!isLoading && !hasSearched && (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-slate-200 rounded-3xl border-dashed">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Search className="text-slate-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Start your search</h3>
          <p className="text-slate-500 max-w-sm">
            Add one or more keywords above — like a skill, language, or project tag — to find
            matching students.
          </p>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <>
          <p className="text-sm font-medium text-slate-500 mb-4">
            {results.length} student{results.length === 1 ? "" : "s"} found
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {results.map((student) => (
              <StudentCard key={student.id} student={student} onViewProfile={setSelectedStudentId} />
            ))}
          </div>
        </>
      )}

      <StudentProfileModal studentId={selectedStudentId} onClose={() => setSelectedStudentId(null)} />
    </div>
  );
}
