'use client'

import { OneRepMaxTab } from './_components/OneRepMaxTab'
import { useOneRepMaxes } from './_hooks/useOneRepMaxes'

export default function OneRepMaxPage() {
  const { oneRepMaxes, liftValues, savingLift, setLiftEntry, handleSaveLift } = useOneRepMaxes()

  return (
    <OneRepMaxTab
      oneRepMaxes={oneRepMaxes}
      liftValues={liftValues}
      savingLift={savingLift}
      onSetEntry={setLiftEntry}
      onSave={handleSaveLift}
    />
  )
}
