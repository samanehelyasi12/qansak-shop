import Link from "next/link";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Container>
        <div className="text-center py-16">
          <h1 className="mb-4 text-6xl font-bold text-caramel">۴۰۴</h1>
          <h2 className="mb-4 text-2xl font-bold text-cocoa">صفحه مورد نظر یافت نشد</h2>
          <p className="mb-8 text-lg text-cocoa/70">
            متاسفیم، صفحهٔ مورد نظر شما وجود ندارد یا منتقل شده است.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/">
              <Button size="lg">بازگشت به خانه</Button>
            </Link>
            <Link href="/categories/cakes">
              <Button variant="secondary" size="lg">
                دسته‌بندی‌ها
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}