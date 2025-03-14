"use client";

import type React from "react";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Trash2, PlayCircle } from "lucide-react";
import { getQuizList, deleteQuiz, type QuizMetadata } from "@/lib/quiz-store";

export default function ActiveQuizList() {
  const [quizzes, setQuizzes] = useState<QuizMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load quizzes from localStorage
    const loadQuizzes = () => {
      const list = getQuizList();
      // Sort by last updated (most recent first)
      list.sort((a, b) => b.lastUpdated - a.lastUpdated);
      setQuizzes(list);
      setLoading(false);
    };

    loadQuizzes();

    // Set up interval to refresh the list periodically
    const interval = setInterval(loadQuizzes, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleDeleteQuiz = (quizId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      confirm(
        "Apakah Anda yakin ingin menghapus ujian ini? Semua kemajuan akan hilang."
      )
    ) {
      deleteQuiz(quizId);
      setQuizzes(quizzes.filter((quiz) => quiz.quizId !== quizId));
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Memuat daftar ujian...</p>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Ujian Aktif</h2>
        <p className="text-muted-foreground">Belum ada ujian yang dimulai.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-center">Ujian Aktif</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz) => (
          <Link href={`/quiz/${quiz.quizId}`} key={quiz.quizId}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-4 w-4" />
                  <span className="truncate">{quiz.fileName}</span>
                </CardTitle>
                <CardDescription>
                  {quiz.completed ? "Selesai" : "Dalam progres"} •{" "}
                  {quiz.totalQuestions} soal
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-col space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dimulai:</span>
                    <span>{formatDate(quiz.startedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Terakhir aktif:
                    </span>
                    <span>{formatDate(quiz.lastUpdated)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => handleDeleteQuiz(quiz.quizId, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="gap-1">
                  {quiz.completed ? "Lihat Hasil" : "Lanjutkan"}
                  {!quiz.completed && <PlayCircle className="h-4 w-4 ml-1" />}
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
