import { useListShopItems, usePurchaseShopItem, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Gem, Heart, Flame, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const iconMap: Record<string, React.ElementType> = {
  heart: Heart,
  streak: Flame,
  power_up: Zap,
  cosmetic: Sparkles,
  default: Gem,
};

// Dummy Zap for import fallback
function Zap(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>;
}


export default function Shop() {
  const { data: user } = useGetMe();
  const { data: items, isLoading } = useListShopItems();
  const purchaseItem = usePurchaseShopItem();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handlePurchase = (itemId: string, price: number) => {
    if ((user?.gems || 0) < price) {
      toast({
        title: "Очир хүрэлцэхгүй",
        description: "Очир олохын тулд илүү хичээл хийгээрэй!",
        variant: "destructive",
      });
      return;
    }

    purchaseItem.mutate(
      { data: { itemId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({
            title: "Худалдан авалт амжилттай!",
            description: "Эд зүйл амжилттай идэвхжлээ.",
          });
        },
        onError: () => {
          toast({
            title: "Худалдан авалт амжилтгүй",
            description: "Алдаа гарлаа. Дахин оролдоно уу.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-black">Дэлгүүр</h1>
        <p className="text-muted-foreground font-medium mt-2">
          Олж авсан очироо зарцуулаарай
        </p>
        <div className="inline-flex items-center justify-center mt-6 px-6 py-3 bg-purple-100 text-purple-700 rounded-full font-bold text-xl border-2 border-purple-200">
          <Gem className="w-6 h-6 mr-2 fill-purple-500" />
          {user?.gems || 0} Очир
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {items?.map((item) => {
          const Icon = iconMap[item.category] || iconMap.default;
          const isAffordable = (user?.gems || 0) >= item.priceGems;
          const isPending = purchaseItem.isPending && purchaseItem.variables?.data.itemId === item.id;

          return (
            <div
              key={item.id}
              className={cn(
                "p-6 rounded-2xl border-2 border-b-4 bg-card flex flex-col items-center text-center gap-4",
                item.owned ? "opacity-75" : ""
              )}
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                <Icon className="w-10 h-10 text-primary fill-primary/20" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-sm text-muted-foreground font-medium h-10 mt-1">
                  {item.description}
                </p>
              </div>
              
              <button
                onClick={() => handlePurchase(item.id, item.priceGems)}
                disabled={item.owned || !isAffordable || purchaseItem.isPending}
                className={cn(
                  "button-press w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-b-4 transition-all",
                  item.owned
                    ? "bg-muted text-muted-foreground border-muted-border cursor-not-allowed"
                    : isAffordable
                    ? "bg-primary text-primary-foreground border-primary-border"
                    : "bg-muted text-muted-foreground border-muted-border cursor-not-allowed"
                )}
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : item.owned ? (
                  "Идэвхтэй"
                ) : (
                  <>
                    <Gem className="w-5 h-5 fill-current" />
                    {item.priceGems}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
