export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-red-200 p-10 max-w-sm w-full text-center">
        <h2 className="text-xl font-bold text-red-600 mb-2">Authentication Error</h2>
        <p className="text-gray-500 text-sm">{error ?? "An error occurred during sign in."}</p>
      </div>
    </div>
  );
}
