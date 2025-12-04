import { toast } from '@/hooks/useToast';

export const showSuccess = (title: string, description?: string) => {
    toast({
        title,
        description,
        variant: 'success',
    });
};

export const showError = (title: string, description?: string) => {
    toast({
        title,
        description,
        variant: 'destructive',
    });
};

export const showInfo = (title: string, description?: string) => {
    toast({
        title,
        description,
        variant: 'default',
    });
};
