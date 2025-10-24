import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { BenchmarksContent } from "./components/BenchmarksContent"

export default function BenchmarksPage() {
    return (
        <ProtectedRoute>
            <BenchmarksContent />
        </ProtectedRoute>
    )
}