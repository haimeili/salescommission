package implementation;

import java.util.*;

import base.Associate;

public class Computing {
	
	/*
	 * recToAssoc: key: recruiter ID, value: these associates's ID who are recruited by this recruiter
	 * assocToRec: key: associate ID, value: this associate's recruiter who recruits this associate  
	 * assocToCom: key: associate ID, value: this associate's commission
	 */
	Map<String, HashSet<String>> recToAssoc = new HashMap<String, HashSet<String>>();
	Map<String, String> assocToRec = new HashMap<String, String>();
	Map<String, Double> assocToCom = new HashMap<String, Double>();
	
	/*
	 * According to input information to build the multi-layer tree
	 */
	private void buildGraph(List<Associate> associates) {
		for (Associate assoc: associates) {
			if (!recToAssoc.containsKey(assoc.recId)) 
				recToAssoc.put(assoc.recId,  new HashSet<String>());
			recToAssoc.get(assoc.recId).add(assoc.id);
			// here we assume the toppest associate is CEO, and in DB, his recrutierId is #
			if (!assoc.recId.equals("#"))
				assocToRec.put(assoc.id, assoc.recId);
			
			assocToCom.put(assoc.id, getCommission(assoc.sales));
		}
	}
	
	/*
	 * Using BFS algorithm to update each associate's commissions from bottom to top 
	 */
	private void updateCommissionsByGraph() {
		Map<String, Integer> numOfChild = new HashMap<String, Integer>();
		for (String recId: recToAssoc.keySet()) {
			numOfChild.put(recId,  recToAssoc.get(recId).size());
		}
		
		Queue<String> queue = new LinkedList<String>();
		for (String assocId: assocToRec.keySet()) {
			if (!recToAssoc.containsKey(assocId)) {
				queue.add(assocId);
			}
		}
		while(!queue.isEmpty()) {
			String assocId = queue.poll();
			if (!assocToRec.containsKey(assocId)) break;
			else {
				String recruiterId = assocToRec.get(assocId);
				numOfChild.put(recruiterId, numOfChild.get(recruiterId)-1);
				if (numOfChild.get(recruiterId)==0) {
					queue.add(recruiterId);
				}
				
				// update associate's and his/her recruiter's commission
				double updateSales = updateCommission(assocToCom.get(assocId));
				assocToCom.put(assocId, updateSales);
				assocToCom.put(recruiterId, assocToCom.get(recruiterId)+updateSales);
			}
		}
	}
	
	/*
	 * update  the commission by the rule: 
	 * "must pay half of their commission to the associate who recruited them"
	 */
	private double updateCommission(double salesVal) {
		return salesVal*0.5;
	}
	
	/*
	 * compute the commission by the rule:
	 * "Associates earn a 10% commission on all of their sales"
	 */
	private double getCommission(double salesVal) {
		return salesVal*0.1;
	}
	
	private void printCommissions() {
		for (String assocId: assocToCom.keySet()) {
			System.out.println("Associate ID is: " + assocId+
					" ; the final commission is: "+assocToCom.get(assocId) + " $");
		}
	}
	
	private void updateInput(List<Associate> associates) {
		for (Associate assoc: associates) {
			assoc.finalCom = assocToCom.get(assoc.id);
		}
	}
	
	/*
	 * main interface to finish task:
	 * Step-1: build graph/tree by input info
	 * Step-2: update commission by BFS 
	 * Step-3: update final commission back to input
	 * Step-4: print each associate's final commission
	 */
	public void printFinalCommissions(List<Associate> associates) {
		buildGraph(associates);
		updateCommissionsByGraph();
		updateInput(associates);
		printCommissions();
	}
	
}