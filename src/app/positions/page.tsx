"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PositionsPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/ports");
  }, [router]);
  return null;
}
