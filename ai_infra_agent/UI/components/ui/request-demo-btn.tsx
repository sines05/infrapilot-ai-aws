"use client";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RequestDemoButton() {
  const router = useRouter();

  const handleDemo = async () => {
    try {
      const res = await fetch("/api/demo/create-temp-user", { method: "POST" });
      const data = await res.json();
      if (!data.user) throw new Error("Failed to create demo user");

      // Đăng nhập demo user tạm thời
      await signIn("credentials", {
        redirect: false,
        email: data.user.email,
        password: "",
      });

      router.push("/dashboard/credentials");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button
      onClick={handleDemo}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      Request Demo
    </button>
  );
}
