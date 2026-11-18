'use client'

import { OneRepMaxTab } from './_components/OneRepMaxTab'
import { useOneRepMaxes } from './_hooks/useOneRepMaxes'

export default function OneRepMaxPage() {
  const {
    oneRepMaxes,
    history,
    liftValues,
    savingLift,
    deletingId,
    setLiftEntry,
    handleSaveLift,
    handleDeleteHistory,
  } = useOneRepMaxes()

  return (
    <OneRepMaxTab
      oneRepMaxes={oneRepMaxes}
      history={history}
      liftValues={liftValues}
      savingLift={savingLift}
      deletingId={deletingId}
      onSetEntry={setLiftEntry}
      onSave={handleSaveLift}
      onDelete={handleDeleteHistory}
    />
  )
}
