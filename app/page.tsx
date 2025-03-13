import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md mx-auto text-center space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-4xl">
          Aplikasi Ujian PDF
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Jawab soal dari file PDF dengan pelacakan waktu
        </p>
        <div className="mt-8">
          <Link href="/quiz">
            <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-lg">
              Mulai Ujian
            </Button>
          </Link>
        </div>
      </div>
      <footer className="absolute bottom-4 text-gray-500 dark:text-gray-400 text-sm">
        Created by Kanz & v0
      </footer>
    </main>
  );
}
