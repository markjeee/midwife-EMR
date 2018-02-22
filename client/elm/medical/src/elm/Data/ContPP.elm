module Data.ContPP
    exposing
        ( Field(..)
        , MedVacLab(..)
        , SubMsg(..)
        )

import Dict exposing (Dict)

-- LOCAL IMPORTS --

import Const exposing (Dialog(..), FldChgValue)
import Data.ContPostpartumCheck exposing (ContPostpartumCheckId)
import Data.DataCache exposing (DataCache)
import Data.DatePicker exposing (DateFieldMessage)
import Data.PregnancyHeader exposing (PregHeaderContentMsg)
import Data.Table exposing (Table)


type SubMsg
    = PageNoop
    | RotatePregHeaderContent PregHeaderContentMsg
      -- DataCache is the mechanism used to retrieve records from
      -- the top-level that it has received from the server. The
      -- top-level intercepts this message and creates a new message
      -- with the latest DataCache that it has and sends it down to
      -- us again. We, in turn, populate our page Model based on the
      -- list of tables passed through.
    | DataCache (Maybe (Dict String DataCache)) (Maybe (List Table))
    | HandleNewbornExamModal Dialog
    | HandleBabyMedVacLabModal Dialog (Maybe MedVacLab)
    | HandleContPostpartumCheckModal Dialog (Maybe ContPostpartumCheckId)
      -- These two are used for browsers that do not support the
      -- input date type and require the use of jQueryUI datepicker.
    | OpenDatePickerSubMsg String
    | DateFieldSubMsg DateFieldMessage
    | FldChgSubMsg Field FldChgValue


{-| The Int parameter refers to the respective
medication, vaccination, or lab id.
-}
type MedVacLab
    = MedMVL Int
    | VacMVL Int
    | LabMVL Int

{-| The fields we use. NotUsed is a special case for handling a MedVacLab
when we have not started working with Labs yet.
-}
type Field
    = NotUsed
    | NBSDateFld
    | NBSTimeFld
    | NBSExaminersFld
    | NBSRRFld
    | NBSHRFld
    | NBSTemperatureFld
    | NBSLengthFld
    | NBSHeadCirFld
    | NBSChestCirFld
    | NBSAppearanceFld
    | NBSColorFld
    | NBSSkinFld
    | NBSHeadFld
    | NBSEyesFld
    | NBSEarsFld
    | NBSNoseFld
    | NBSMouthFld
    | NBSNeckFld
    | NBSChestFld
    | NBSLungsFld
    | NBSHeartFld
    | NBSAbdomenFld
    | NBSHipsFld
    | NBSCordFld
    | NBSFemoralPulsesFld
    | NBSGenitaliaFld
    | NBSAnusFld
    | NBSBackFld
    | NBSExtremitiesFld
    | NBSEstGAFld
    | NBSMoroReflexFld
    | NBSMoroReflexCommentFld
    | NBSPalmarReflexFld
    | NBSSteppingReflexCommentFld
    | NBSPlantarReflexFld
    | NBSBabinskiReflexCommentFld
    | NBSBabinskiReflexFld
    | NBSCommentsFld
    | NBSPlantarReflexCommentFld
    | NBSSteppingReflexFld
    | NBSPalmarReflexCommentFld
    | CPCCheckDateFld
    | CPCCheckTimeFld
    | CPCMotherSystolicFld
    | CPCMotherDiastolicFld
    | CPCMotherCRFld
    | CPCMotherTempFld
    | CPCMotherFundusFld
    | CPCMotherEBLFld
    | CPCBabyBFedFld
    | CPCBabyTempFld
    | CPCBabyRRFld
    | CPCBabyCRFld
    | CPCCommentsFld
    | BabyMedDateFld
    | BabyMedTimeFld
    | BabyMedLocationFld
    | BabyMedInitialsFld
    | BabyMedCommentsFld
    | BabyVacDateFld
    | BabyVacTimeFld
    | BabyVacLocationFld
    | BabyVacInitialsFld
    | BabyVacCommentsFld
    | BabyLabDateFld
    | BabyLabTimeFld
    | BabyLabFld1ValueFld
    | BabyLabFld2ValueFld
    | BabyLabFld3ValueFld
    | BabyLabFld4ValueFld
    | BabyLabInitialsFld
