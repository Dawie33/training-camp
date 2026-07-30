import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { Building2, Dumbbell, Instagram, Search, Target } from 'lucide-react'

interface DateActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  onScheduleWorkout: () => void
  onParseBoxWod: () => void
  onLookupWod: () => void
  onMarkBoxDay: () => void
  onPlanSkill: () => void
}

export function DateActionDialog({ open, onOpenChange, selectedDate, onScheduleWorkout, onParseBoxWod, onLookupWod, onMarkBoxDay, onPlanSkill }: DateActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[340px] bg-card border-border text-foreground">
        <DialogHeader>
          <span className="eyebrow">Planifier</span>
          <DialogTitle className="font-display text-foreground text-lg capitalize">
            {format(selectedDate, 'EEEE dd MMMM')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col divide-y divide-border pt-1">
          <button
            onClick={() => { onOpenChange(false); onScheduleWorkout() }}
            className="group flex items-center gap-3 w-full py-3 text-left transition-colors hover:bg-muted/60"
          >
            <Dumbbell className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Chercher un workout existant</div>
              <div className="text-xs text-muted-foreground">Parcourir la bibliothèque</div>
            </div>
          </button>
          <button
            onClick={() => { onOpenChange(false); onLookupWod() }}
            className="group flex items-center gap-3 w-full py-3 text-left transition-colors hover:bg-muted/60"
          >
            <Search className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Rechercher un WOD connu</div>
              <div className="text-xs text-muted-foreground">Fran, Murph, Open 18.1, Hero WOD...</div>
            </div>
          </button>
          <button
            onClick={() => { onOpenChange(false); onParseBoxWod() }}
            className="group flex items-center gap-3 w-full py-3 text-left transition-colors hover:bg-muted/60"
          >
            <Instagram className="w-5 h-5 text-fuchsia-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Coller depuis Instagram</div>
              <div className="text-xs text-muted-foreground">L&apos;IA parse la légende du WOD</div>
            </div>
          </button>
          <button
            onClick={() => { onOpenChange(false); onMarkBoxDay() }}
            className="group flex items-center gap-3 w-full py-3 text-left transition-colors hover:bg-muted/60"
          >
            <Building2 className="w-5 h-5 text-violet-600 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Jour Box CrossFit</div>
              <div className="text-xs text-muted-foreground">Marquer ce jour comme entraînement en box</div>
            </div>
          </button>
          <button
            onClick={() => { onOpenChange(false); onPlanSkill() }}
            className="group flex items-center gap-3 w-full py-3 text-left transition-colors hover:bg-muted/60"
          >
            <Target className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Travailler un skill</div>
              <div className="text-xs text-muted-foreground">Planifier une séance de progression</div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
