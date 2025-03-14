"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExitQuizDialogProps {
  onSaveAndExit: () => void;
  onContinue: () => void;
}

export default function ExitQuizDialog({
  onSaveAndExit,
  onContinue,
}: ExitQuizDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSaveAndExit = () => {
    onSaveAndExit();
    setOpen(false);
    router.push("/");
  };

  const handleContinue = () => {
    onContinue();
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="absolute top-4 right-4 z-10"
      >
        Keluar Ujian
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Keluar dari Ujian?
            </DialogTitle>
            <DialogDescription>
              Anda akan keluar dari ujian ini. Kemajuan Anda akan disimpan dan
              Anda dapat melanjutkan nanti.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Waktu ujian akan terus berjalan meskipun Anda keluar. Anda dapat
              melanjutkan ujian ini dari halaman utama.
            </p>
            <p className="text-sm font-medium text-amber-600">
              Catatan: Jika Anda keluar, timer ujian akan terus berjalan.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleContinue}>
              Lanjutkan Ujian
            </Button>
            <Button variant="default" onClick={handleSaveAndExit}>
              Simpan & Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
