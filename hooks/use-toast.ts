import toast from "react-hot-toast";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

export function useToast() {
  return {
    toast: ({ title, description, variant }: ToastProps) => {
      if (variant === "destructive") {
        toast.error(`${title}\n${description || ""}`);
      } else {
        toast.success(`${title}\n${description || ""}`);
      }
    },
    dismiss: (toastId?: string) => toast.dismiss(toastId),
  };
}
