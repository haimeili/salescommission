package base;

public class Associate {
	/*
	 * id: which can be number or letter, here we define String to support all types
	 * sales: which can be integer/float/double, here we use double to support all
	 * recId: this associate's recruiter's ID
	 * finalCom: this associate's final commission 
	 */
	public String id;
	public double sales;
	public String recId;
	public double finalCom;
	
	public Associate(String id, double sales, String recruiterId) {
		this.id = id;
		this.sales = sales;
		this.recId = recruiterId;
	}
}