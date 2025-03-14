"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Save,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ExitQuizDialog from "@/components/exit-quiz-dialog";
import {
  getQuizState,
  saveQuizState,
  completeQuiz,
  calculateElapsedTime,
  type QuizState,
} from "@/lib/quiz-store";

export default function Quiz() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = params.quizId as string;

  // State for quiz data
  const [questionNumber, setQuestionNumber] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number>(40);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [fileName, setFileName] = useState<string>("");

  // Timer states
  const [globalTimer, setGlobalTimer] = useState<number>(0);
  const [timeSpent, setTimeSpent] = useState<Record<number, number>>({});
  const [currentQuestionStartTime, setCurrentQuestionStartTime] =
    useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // PDF state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // State untuk dialog konfirmasi
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load quiz state from localStorage
  useEffect(() => {
    const loadQuizState = async () => {
      try {
        setIsLoading(true);

        // Get quiz state from localStorage
        const state = getQuizState(quizId);

        if (!state) {
          // If no state found, check if we have a PDF URL in the query params
          const pdfUrlFromParams = searchParams.get("pdfUrl");

          if (!pdfUrlFromParams) {
            setError(
              "Ujian tidak ditemukan. Silakan kembali ke halaman utama."
            );
            setIsLoading(false);
            return;
          }

          // We're starting a new quiz, so we'll use the URL from params
          setPdfUrl(decodeURIComponent(pdfUrlFromParams));
        } else {
          // We have existing state, load it
          setQuestionNumber(state.currentQuestion);
          setTotalQuestions(state.totalQuestions);
          setAnswers(state.answers);
          setTimeSpent(state.timeSpent);
          setFileName(state.fileName);

          // Calculate elapsed time since last update
          const elapsedSeconds = calculateElapsedTime(state.lastUpdated);
          setGlobalTimer(state.globalTimer + elapsedSeconds);

          // If we have a stored PDF URL, use it
          if (state.pdfObjectUrl) {
            setPdfUrl(state.pdfObjectUrl);
          } else {
            // Otherwise check if we have one in the query params
            const pdfUrlFromParams = searchParams.get("pdfUrl");
            if (pdfUrlFromParams) {
              setPdfUrl(decodeURIComponent(pdfUrlFromParams));
            }
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading quiz state:", error);
        setError("Terjadi kesalahan saat memuat data ujian.");
        setIsLoading(false);
      }
    };

    loadQuizState();
  }, [quizId, searchParams]);

  // Start timer and save interval when quiz is loaded
  useEffect(() => {
    if (!isLoading && !error) {
      // Start the timer
      timerRef.current = setInterval(() => {
        setGlobalTimer((prev) => prev + 1);
      }, 1000);

      // Set up auto-save interval (every 10 seconds)
      saveIntervalRef.current = setInterval(() => {
        saveQuizProgress();
      }, 10000);

      // Initialize start time for the current question
      setCurrentQuestionStartTime(Date.now());
    }

    return () => {
      // Clean up intervals
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [isLoading, error]);

  // Save quiz progress
  const saveQuizProgress = () => {
    // Update time spent on current question
    const now = Date.now();
    const timeOnQuestion = Math.floor((now - currentQuestionStartTime) / 1000);

    const updatedTimeSpent = {
      ...timeSpent,
      [questionNumber]: (timeSpent[questionNumber] || 0) + timeOnQuestion,
    };

    // Create quiz state object
    const quizState: QuizState = {
      quizId,
      fileName,
      totalQuestions,
      currentQuestion: questionNumber,
      answers,
      timeSpent: updatedTimeSpent,
      globalTimer,
      lastUpdated: Date.now(),
      pdfObjectUrl: pdfUrl || undefined,
    };

    // Save to localStorage
    saveQuizState(quizState);

    // Reset current question start time
    setCurrentQuestionStartTime(now);

    // Update timeSpent state
    setTimeSpent(updatedTimeSpent);
  };

  // Update time spent when changing questions
  useEffect(() => {
    if (!isLoading && !error && questionNumber > 0) {
      const now = Date.now();
      const timeOnQuestion = Math.floor(
        (now - currentQuestionStartTime) / 1000
      );

      // Update time spent on the previous question
      setTimeSpent((prev) => ({
        ...prev,
        [questionNumber]: (prev[questionNumber] || 0) + timeOnQuestion,
      }));

      // Reset start time for the new question
      setCurrentQuestionStartTime(now);

      // Load the answer for the new question if it exists
      setSelectedAnswer(answers[questionNumber] || null);
    }
  }, [questionNumber, isLoading, error]);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith("blob:")) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Save current answer when it changes
  useEffect(() => {
    if (selectedAnswer !== null) {
      setAnswers((prev) => ({
        ...prev,
        [questionNumber]: selectedAnswer,
      }));
    }
  }, [selectedAnswer, questionNumber]);

  // Fungsi untuk menangani navigasi PDF secara manual
  const handlePdfNavigation = (pageNumber: number) => {
    const pdfObject = document.querySelector(
      'object[type="application/pdf"]'
    ) as HTMLObjectElement;
    if (pdfObject && pdfObject.contentWindow) {
      try {
        // Coba navigasi ke halaman yang diinginkan
        const pdfWindow = pdfObject.contentWindow;
        pdfWindow.postMessage({ type: "navigate", page: pageNumber }, "*");
      } catch (error) {
        console.error("Error navigating PDF:", error);
      }
    }
  };

  // Navigation functions
  const goToPrevQuestion = () => {
    if (questionNumber > 1) {
      saveQuizProgress();
      const newQuestionNumber = questionNumber - 1;
      setQuestionNumber(newQuestionNumber);
      setCurrentQuestionStartTime(Date.now());

      // Try to navigate PDF to the corresponding page
      handlePdfNavigation(newQuestionNumber);
    }
  };

  const goToNextQuestion = () => {
    if (questionNumber < totalQuestions) {
      saveQuizProgress();
      const newQuestionNumber = questionNumber + 1;
      setQuestionNumber(newQuestionNumber);
      setCurrentQuestionStartTime(Date.now());

      // Try to navigate PDF to the corresponding page
      handlePdfNavigation(newQuestionNumber);
    }
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Fungsi untuk menampilkan dialog konfirmasi
  const openConfirmDialog = () => {
    setShowConfirmDialog(true);
  };

  // Handle quiz submission
  const handleSubmit = () => {
    // Save final progress
    saveQuizProgress();

    // Mark quiz as completed
    completeQuiz(quizId);

    // Navigate to results page with data
    router.push(
      `/quiz/results?data=${encodeURIComponent(
        JSON.stringify({
          answers,
          timeSpent,
          totalTime: globalTimer,
          totalQuestions,
          fileName,
        })
      )}`
    );
  };

  // Handle exit quiz
  const handleExitQuiz = () => {
    saveQuizProgress();
  };

  // Hitung jumlah soal yang sudah dijawab
  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  // Manual question input handler
  const handleQuestionInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= totalQuestions) {
      saveQuizProgress();
      setQuestionNumber(value);
      setCurrentQuestionStartTime(Date.now());

      // Try to navigate PDF to the corresponding page
      handlePdfNavigation(value);
    }
  };

  // Get time spent on current question
  const getCurrentQuestionTime = () => {
    const now = Date.now();
    const timeOnQuestion = Math.floor((now - currentQuestionStartTime) / 1000);
    return (timeSpent[questionNumber] || 0) + timeOnQuestion;
  };

  // Effect untuk menangani navigasi PDF saat questionNumber berubah
  useEffect(() => {
    if (!isLoading && !error && pdfUrl) {
      // Coba navigasi ke halaman yang sesuai dengan nomor soal
      const iframe = document.querySelector(
        'iframe[src*="pdf"]'
      ) as HTMLIFrameElement;
      if (iframe) {
        try {
          // Jika ada iframe PDF, coba navigasi
          iframe.src = `${pdfUrl}#page=${questionNumber}`;
        } catch (error) {
          console.error("Error navigating PDF iframe:", error);
        }
      }

      // Alternatif menggunakan object tag
      const pdfObject = document.querySelector(
        'object[type="application/pdf"]'
      ) as HTMLObjectElement;
      if (pdfObject) {
        try {
          // Coba set data dengan parameter halaman
          pdfObject.data = `${pdfUrl}#page=${questionNumber}`;
        } catch (error) {
          console.error("Error navigating PDF object:", error);
        }
      }
    }
  }, [questionNumber, isLoading, error, pdfUrl]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Memuat ujian...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={() => router.push("/")}>Kembali ke Beranda</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col p-4">
      {/* Exit Quiz Dialog */}
      <ExitQuizDialog onSaveAndExit={handleExitQuiz} onContinue={() => {}} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">
            Waktu total: {formatTime(globalTimer)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">
            Waktu di soal ini: {formatTime(getCurrentQuestionTime())}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Soal:</span>
          <input
            type="number"
            min="1"
            max={totalQuestions}
            value={questionNumber}
            onChange={handleQuestionInput}
            className="w-16 h-8 text-center border rounded"
          />
          <span className="text-sm font-medium">dari {totalQuestions}</span>
        </div>
      </div>

      <div className="w-full bg-primary text-primary-foreground py-3 px-4 mb-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-center">
          Soal Nomor {questionNumber} dari {totalQuestions}
        </h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1">
        {/* PDF Viewer using iframe for better navigation */}
        <div className="flex-1 border rounded-lg overflow-hidden bg-white">
          {pdfUrl ? (
            <div className="w-full h-[70vh] overflow-hidden">
              <iframe
                src={`${pdfUrl}#page=${questionNumber}`}
                className="w-full h-full"
                title="PDF Viewer"
              ></iframe>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <FileText className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Tidak ada PDF yang dimuat</p>
            </div>
          )}
        </div>

        {/* Answer Section */}
        <div className="w-full md:w-80">
          <Card>
            <CardHeader className="bg-muted">
              <CardTitle>Jawaban Soal {questionNumber}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <RadioGroup
                value={selectedAnswer || ""}
                onValueChange={setSelectedAnswer}
                className="space-y-3"
              >
                {["a", "b", "c", "d"].map((option) => (
                  <div
                    key={option}
                    className={`flex items-center space-x-2 rounded-md border p-3 ${
                      selectedAnswer === option
                        ? "border-primary bg-primary/10"
                        : ""
                    }`}
                  >
                    <RadioGroupItem value={option} id={`option-${option}`} />
                    <Label
                      htmlFor={`option-${option}`}
                      className="flex-1 cursor-pointer"
                    >
                      Opsi {option.toUpperCase()}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevQuestion}
                disabled={questionNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextQuestion}
                disabled={questionNumber >= totalQuestions}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          {questionNumber === totalQuestions && (
            <Button
              className="w-full mt-4"
              onClick={openConfirmDialog}
              variant="default"
            >
              <Save className="mr-2 h-4 w-4" /> Selesai & Lihat Hasil
            </Button>
          )}
        </div>
      </div>

      {/* Dialog Konfirmasi Submit */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Konfirmasi Pengumpulan
            </DialogTitle>
            <DialogDescription>
              Anda akan mengakhiri ujian dan melihat hasil.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="rounded-lg bg-muted p-4 mb-4">
              <p className="font-medium mb-2">Ringkasan:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Total soal:</span>
                  <span className="font-medium">{totalQuestions}</span>
                </li>
                <li className="flex justify-between">
                  <span>Soal terjawab:</span>
                  <span className="font-medium">
                    {getAnsweredCount()} dari {totalQuestions}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Soal belum terjawab:</span>
                  <span className="font-medium">
                    {totalQuestions - getAnsweredCount()}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Total waktu:</span>
                  <span className="font-medium">{formatTime(globalTimer)}</span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              Setelah mengumpulkan, Anda tidak dapat kembali untuk mengubah
              jawaban.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Kembali ke Soal
            </Button>
            <Button variant="default" onClick={handleSubmit}>
              Ya, Kumpulkan Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
