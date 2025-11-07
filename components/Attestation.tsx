"use client";

import { useSession } from "next-auth/react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Certificate } from "@/components/Certificate";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Loader2 } from "lucide-react";

export default function Attestation() {
  const { data: session } = useSession();
  const [isGenerating, setIsGenerating] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  const hiddenCertificateRef = useRef<HTMLDivElement>(null);

  const downloadCertificate = async () => {
    if (!hiddenCertificateRef.current || !session?.user?.email) return;

    setIsGenerating(true);
    try {
      // Use the hidden, fixed-size certificate for generation
      const element = hiddenCertificateRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 3, // Higher scale for better quality
        logging: false,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 800,
        height: 600,
        windowWidth: 800,
        windowHeight: 600,
      });

      const imgData = canvas.toDataURL("image/png", 0.95);

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [800, 600],
        compress: true,
      });

      pdf.addImage(imgData, "PNG", 0, 0, 800, 600, undefined, "FAST");
      pdf.save("certificat.pdf");

      const response = await fetch("/api/certinfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: session.user.email,
        }),
      });

      if (!response.ok) {
        throw new Error("Échec de la mise à jour dans la base de données");
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Veuillez vous connecter pour voir votre certificat.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-screen-lg mx-auto space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold">Certificat</h1>
          <Button onClick={downloadCertificate} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Télécharger le certificat"
            )}
          </Button>
        </div>

        {/* Visible certificate - responsive */}
        <div className="border rounded-lg overflow-hidden shadow-lg">
          <div className="overflow-auto">
            <div ref={certificateRef} className="min-w-[800px]">
              <Certificate
                userName={session.user?.fullName || "Participant"}
                company={session.user?.companyName || "Entreprise"}
                date={new Date()}
                courseName="Formation Anti-corruption"
              />
            </div>
          </div>
        </div>

        {/* Hidden certificate - fixed size for PDF generation */}
        <div className="fixed -left-[9999px] top-0">
          <div ref={hiddenCertificateRef}>
            <Certificate
              userName={session.user?.fullName || "Participant"}
              company={session.user?.companyName || "Entreprise"}
              date={new Date()}
              courseName="Formation Anti-corruption"
            />
          </div>
        </div>
      </div>
    </div>
  );
}