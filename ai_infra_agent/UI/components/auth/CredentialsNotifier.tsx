// File: components/auth/CredentialsNotifier.tsx

"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Key, AlertTriangle, X } from 'lucide-react';

export default function CredentialsNotifier() {
  const { data: session, status } = useSession();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session) {
      const user = session.user as any; 

      // Kiểm tra nếu một trong các key còn thiếu
      if (!user.aws_access_key || !user.aws_secret_key /* || !user.google_ai_key */) {
        // Hiển thị thông báo nếu người dùng chưa tắt nó trong session này
        if (sessionStorage.getItem('hideCredentialsNotifier') !== 'true') {
          setIsVisible(true);
        }
      }
    }
  }, [session, status]);

  const handleDismiss = () => {
    setIsVisible(false);
    // Lưu trạng thái đã tắt vào sessionStorage để không hiện lại khi reload trang
    sessionStorage.setItem('hideCredentialsNotifier', 'true');
  }

  if (!isVisible || status !== 'authenticated') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
      <Card className="p-4 bg-background border-primary/50 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="mt-1"><AlertTriangle className="h-6 w-6 text-primary" /></div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Cấu hình Credentials</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Để sử dụng đầy đủ tính năng AI, vui lòng cung cấp AWS credentials và các API key cần thiết.
            </p>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm">
                <Link href="/dashboard/credentials">
                  <Key className="mr-2 h-4 w-4" />Đi đến Cài đặt
                </Link>
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}