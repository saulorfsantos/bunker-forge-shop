import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <article
      className={cn(
        "flex flex-col bg-bunker-charcoal border border-bunker-graphite rounded-sm overflow-hidden",
        className,
      )}
    >
      <Skeleton className="aspect-square w-full rounded-none bg-bunker-graphite/60" />
      <div className="flex flex-col flex-1 p-3 md:p-4 gap-2">
        <Skeleton className="h-2.5 w-16 bg-bunker-graphite/60" />
        <Skeleton className="h-4 w-full bg-bunker-graphite/60" />
        <Skeleton className="h-4 w-3/4 bg-bunker-graphite/60" />
        <Skeleton className="h-6 w-24 mt-auto bg-bunker-graphite/60" />
        <Skeleton className="h-9 w-full mt-2 bg-bunker-graphite/60" />
      </div>
    </article>
  );
}
