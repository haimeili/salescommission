package test;

import static org.junit.Assert.*;

import java.util.ArrayList;
import java.util.List;

import org.junit.Test;

import base.Associate;
import implementation.Computing;

public class ComputingTests {

	private static final double DELTA = 1e-15;
	
	@Test
	public void testNull() {
		
	}
	
	
	
	@Test
	public void testTwoLevels() {
		List<Associate> data = new ArrayList<Associate>();
		data.add(new Associate("1", 10.0, "2"));
		data.add(new Associate("2", 20.0, "#"));
		data.add(new Associate("3", 30.0, "2"));
		
		Computing computer = new Computing();
		computer.printFinalCommissions(data);
		
		assertEquals(0.5, data.get(0).finalCom, DELTA);
		assertEquals(4.0, data.get(1).finalCom, DELTA);
		assertEquals(1.5, data.get(2).finalCom, DELTA);
	}
	
	@Test
	public void testUnbalanceTree() {
		List<Associate> data = new ArrayList<Associate>();
		data.add(new Associate("002", 20.0, "#"));
		data.add(new Associate("111", 10.0, "002"));
		data.add(new Associate("439", 20.0, "111"));
		data.add(new Associate("587", 30.0, "111"));
		data.add(new Associate("623", 10.0, "587"));
		data.add(new Associate("333", 30.0, "002"));
		
		Computing computer = new Computing();
		computer.printFinalCommissions(data);
		
		assertEquals(5.375, data.get(0).finalCom, DELTA);
		assertEquals(1.875, data.get(1).finalCom, DELTA);
		assertEquals(1.0, data.get(2).finalCom, DELTA);
		assertEquals(1.75, data.get(3).finalCom, DELTA);
		assertEquals(0.5, data.get(4).finalCom, DELTA);
		assertEquals(1.5, data.get(5).finalCom, DELTA);
	}

}
