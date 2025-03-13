"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Clock,
  FileText,
  FileJson,
  FileSpreadsheet,
} from "lucide-react";

interface QuizResults {
  answers: Record<number, string>;
  timeSpent: Record<number, number>;
  totalTime: number;
  totalQuestions: number;
  fileName: string;
}

export default function Results() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [results, setResults] = useState<QuizResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const data = searchParams.get("data");
      if (data) {
        const parsedData = JSON.parse(decodeURIComponent(data)) as QuizResults;
        setResults(parsedData);
      }
    } catch (error) {
      console.error("Error parsing results data:", error);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    if (!seconds) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Calculate total answered questions
  const getTotalAnswered = () => {
    if (!results) return 0;
    return Object.keys(results.answers).length;
  };

  // Calculate average time per question
  const getAverageTime = () => {
    if (!results || !results.totalTime) return 0;
    const answeredQuestions = getTotalAnswered();
    if (answeredQuestions === 0) return 0;
    return Math.floor(results.totalTime / answeredQuestions);
  };

  // Download results as CSV
  const downloadCSV = () => {
    if (!results) return;

    // Prepare CSV header
    let csv = "Nomor Soal,Jawaban,Waktu (detik),Waktu (format)\n";

    // Add data rows
    for (let i = 1; i <= results.totalQuestions; i++) {
      const answer = results.answers[i] || "";
      const timeSpent = results.timeSpent[i] || 0;
      const timeFormatted = formatTime(timeSpent);
      csv += `${i},${answer.toUpperCase()},${timeSpent},"${timeFormatted}"\n`;
    }

    // Add summary
    csv += "\nRingkasan\n";
    csv += `Total Soal,${results.totalQuestions}\n`;
    csv += `Soal Terjawab,${getTotalAnswered()}\n`;
    csv += `Total Waktu (detik),${results.totalTime}\n`;
    csv += `Total Waktu (format),"${formatTime(results.totalTime)}"\n`;
    csv += `Rata-rata Waktu per Soal (detik),${getAverageTime()}\n`;
    csv += `Rata-rata Waktu per Soal (format),"${formatTime(
      getAverageTime()
    )}"\n`;

    // Create download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `hasil-ujian-${new Date().toISOString().slice(0, 10)}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download results as JSON
  const downloadJSON = () => {
    if (!results) return;

    // Prepare JSON data
    const jsonData = {
      fileName: results.fileName,
      totalQuestions: results.totalQuestions,
      totalAnswered: getTotalAnswered(),
      totalTime: {
        seconds: results.totalTime,
        formatted: formatTime(results.totalTime),
      },
      averageTime: {
        seconds: getAverageTime(),
        formatted: formatTime(getAverageTime()),
      },
      answers: results.answers,
      timeSpent: Object.entries(results.timeSpent).reduce(
        (acc, [key, value]) => {
          acc[key] = {
            seconds: value,
            formatted: formatTime(value),
          };
          return acc;
        },
        {} as Record<string, { seconds: number; formatted: string }>
      ),
    };

    // Create download link
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `hasil-ujian-${new Date().toISOString().slice(0, 10)}.json`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Memuat hasil...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Hasil Tidak Ditemukan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Tidak ada data hasil yang ditemukan.</p>
            <Button onClick={() => router.push("/")}>Kembali ke Beranda</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Button
        variant="outline"
        onClick={() => router.push("/")}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Beranda
      </Button>

      <div className="flex flex-wrap gap-4 mb-6">
        <Button
          variant="outline"
          onClick={downloadCSV}
          className="flex items-center"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Unduh CSV
        </Button>
        <Button
          variant="outline"
          onClick={downloadJSON}
          className="flex items-center"
        >
          <FileJson className="mr-2 h-4 w-4" /> Unduh JSON
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">File Soal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-4 w-4 text-muted-foreground mr-2" />
              <p
                className="text-2xl font-bold truncate"
                title={results.fileName}
              >
                {results.fileName || "Unnamed PDF"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Waktu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-muted-foreground mr-2" />
              <p className="text-2xl font-bold">
                {formatTime(results.totalTime)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Soal Terjawab</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {getTotalAnswered()} dari {results.totalQuestions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Rata-rata Waktu per Soal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatTime(getAverageTime())}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail Jawaban</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor Soal</TableHead>
                <TableHead>Jawaban</TableHead>
                <TableHead>Waktu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(
                { length: results.totalQuestions },
                (_, i) => i + 1
              ).map((questionNum) => (
                <TableRow key={questionNum}>
                  <TableCell>{questionNum}</TableCell>
                  <TableCell>
                    {results.answers[questionNum] ? (
                      <span className="font-medium uppercase">
                        {results.answers[questionNum]}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Tidak dijawab
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatTime(results.timeSpent[questionNum] || 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
