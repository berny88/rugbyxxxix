# -*- coding: utf-8 -*-
import sys
sys.path.append('.')

from StatsServices import StatsManager

nbHits = StatsManager.createHistoryRankings(StatsManager())

print("  -> Nb d'enregistrements en DB créés : "+str(nbHits))
