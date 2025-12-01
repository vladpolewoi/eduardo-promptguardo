export const cardVariants = {
  root: 'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
  header:
    '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
  title: 'leading-none font-semibold',
  description: 'text-muted-foreground text-sm',
  action: 'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
  content: 'px-6',
  footer: 'flex items-center px-6 [.border-t]:pt-6',
};

