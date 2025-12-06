import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Trash2, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AppStatusBadge } from '@/components/AppStatusBadge';
import { ImageUploader } from '@/components/ImageUploader';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useApp, useUpdateApp } from '@/hooks/useEditApp';
import { useDeleteApp } from '@/hooks/useMyApps';
import { useCategories } from '@/hooks/useApps';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(2, 'Titeln måste vara minst 2 tecken'),
  url: z.string().url('Ange en giltig URL'),
  description: z.string().min(10, 'Beskrivningen måste vara minst 10 tecken').max(150, 'Max 150 tecken'),
  long_description: z.string().optional(),
  image_url: z.string().optional(),
  categories: z.array(z.string()).min(1, 'Välj minst en kategori'),
});

type FormValues = z.infer<typeof formSchema>;

interface AppEditPanelProps {
  appId: string;
}

export function AppEditPanel({ appId }: AppEditPanelProps) {
  const navigate = useNavigate();
  const { data: app, isLoading, error } = useApp(appId);
  const { data: categories } = useCategories();
  const updateApp = useUpdateApp();
  const deleteApp = useDeleteApp();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      url: '',
      description: '',
      long_description: '',
      image_url: '',
      categories: [],
    },
  });

  useEffect(() => {
    if (app) {
      form.reset({
        title: app.title,
        url: app.url,
        description: app.description,
        long_description: app.long_description || '',
        image_url: app.image_url || '',
        categories: app.categories || [],
      });
    }
  }, [app, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      await updateApp.mutateAsync({
        appId,
        data: {
          title: values.title,
          url: values.url,
          description: values.description,
          long_description: values.long_description,
          image_url: values.image_url,
          categories: values.categories,
        },
      });

      toast.success('Appen har uppdaterats!');
    } catch (error) {
      toast.error('Kunde inte spara ändringar');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteApp.mutateAsync(appId);
      toast.success('Appen har tagits bort');
      navigate('/min-sida');
    } catch (error) {
      toast.error('Kunde inte ta bort appen');
    }
  };

  const groupedCategories = categories?.reduce((acc, cat) => {
    const type = cat.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(cat);
    return acc;
  }, {} as Record<string, typeof categories>);

  const typeLabels: Record<string, string> = {
    subject: 'Ämne',
    age: 'Ålder',
    type: 'Typ',
    other: 'Övrigt',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">
          {error?.message || 'Kunde inte hitta appen'}
        </p>
        <Button variant="outline" onClick={() => navigate('/min-sida')}>
          Tillbaka
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/min-sida')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Redigera app</h1>
            <div className="flex items-center gap-2 mt-1">
              <AppStatusBadge status={app.status} />
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                Öppna app <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titel</FormLabel>
                <FormControl>
                  <Input placeholder="Appens namn" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kort beskrivning</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Beskriv appen kortfattat..."
                    className="resize-none h-20"
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground text-right">
                  {field.value?.length || 0}/150
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="long_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detaljerad beskrivning (valfritt)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Beskriv appen mer utförligt..."
                    className="resize-none h-32"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image */}
          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bild</FormLabel>
                <FormControl>
                  <ImageUploader
                    value={field.value}
                    onChange={(url) => field.onChange(url || '')}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Categories */}
          <FormField
            control={form.control}
            name="categories"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategorier</FormLabel>
                <div className="space-y-4">
                  {groupedCategories && Object.entries(groupedCategories).map(([type, cats]) => (
                    <div key={type} className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {typeLabels[type] || type}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {cats?.map((cat) => {
                          const isSelected = field.value.includes(cat.id);
                          return (
                            <label
                              key={cat.id}
                              className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors
                                ${isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted hover:bg-muted/80'
                                }
                              `}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, cat.id]);
                                  } else {
                                    field.onChange(field.value.filter((id) => id !== cat.id));
                                  }
                                }}
                                className="hidden"
                              />
                              {cat.name}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Ta bort
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ta bort app?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Detta går inte att ångra. Appen och alla tillhörande data kommer att tas bort permanent.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Ta bort
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/min-sida')}
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={updateApp.isPending}
              >
                {updateApp.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Spara ändringar
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
