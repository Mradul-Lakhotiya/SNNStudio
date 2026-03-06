import java.io.*;
import java.util.*;

public class Main {
    // ================ FAST I/O UTILITIES =====================

    private static final byte[] buffer = new byte[1 << 16];
    private static int ptr = 0, len = 0;
    private static PrintWriter out = new PrintWriter(System.out);

    private static int read() throws IOException {
        if (ptr >= len) {
            len = System.in.read(buffer);
            ptr = 0;

            if (len <= 0) {
                return -1;
            }
        }

        return buffer[ptr++];
    }

    private static int nextInt() throws IOException {
        int c, sgn = 1, res = 0;

        do {
            c = read();
        } 
        while (c <= ' ');

        if (c == '-') {
            sgn = -1;
            c = read();
        }

        while (c > ' ') {
            res = res * 10 + (c - '0');
            c = read();
        }

        return res * sgn;
    }

    private static long nextLong() throws IOException {
        int c;
        long sgn = 1, res = 0;

        do {
            c = read();
        } 
        while (c <= ' ');

        if (c == '-') {
            sgn = -1;
            c = read();
        }

        while (c > ' ') {
            res = res * 10 + (c - '0');
            c = read();
        }

        return res * sgn;
    }

    private static String next() throws IOException {
        int c;
        StringBuilder sb = new StringBuilder();

        do {
            c = read();
        } 
        while (c <= ' ');

        while (c > ' ') {
            sb.append((char) c);
            c = read();
        }

        return sb.toString();
    }

    private static String nextLine() throws IOException {
        int c;
        StringBuilder sb = new StringBuilder();
        c = read();

        while (c != '\n' && c != -1) {
            if (c != '\r') {
                sb.append((char) c);
            }
            c = read();
        }

        return sb.toString();
    }

    private static int[] readIntArray(int n) throws IOException {
        int[] arr = new int[n];

        for (int i = 0; i < n; i++) {
            arr[i] = nextInt();
        }

        return arr;
    }

    private static long[] readLongArray(int n) throws IOException {
        long[] arr = new long[n];

        for (int i = 0; i < n; i++) {
            arr[i] = nextLong();
        }

        return arr;
    }

    // ==================== MATH UTILITIES ====================
    private static long gcd(long a, long b) {
        return b == 0 ? a : gcd(b, a % b);
    }

    private static long lcm(long a, long b) {
        return a / gcd(a, b) * b;
    }

    private static long mod(long x, long m) {
        return ((x % m) + m) % m;
    }

    private static long power(long x, long y, long mod) {
        long res = 1;
        x %= mod;

        while (y > 0) {
            if ((y & 1) == 1) res = (res * x) % mod;
            x = (x * x) % mod;
            y >>= 1;
        }

        return res;
    }

    private static long modInverse(long a, long mod) {
        return power(a, mod - 2, mod);
    }

    // ==================== ARRAY UTILITIES ====================
    private static void sort(int[] arr) {
        ArrayList<Integer> list = new ArrayList<>();
        
        for (int x : arr) {
            list.add(x);
        }

        Collections.sort(list);

        for (int i = 0; i < arr.length; i++) {
            arr[i] = list.get(i);
        }
    }

    private static void sort(long[] arr) {
        ArrayList<Long> list = new ArrayList<>();

        for (long x : arr) {
            list.add(x);
        }

        Collections.sort(list);

        for (int i = 0; i < arr.length; i++) {
            arr[i] = list.get(i);
        }
    }

    private static void reverse(int[] arr) {
        int n = arr.length;

        for (int i = 0; i < n / 2; i++) {
            int temp = arr[i];
            arr[i] = arr[n - i - 1];
            arr[n - i - 1] = temp;
        }
    }

    private static long sumArray(int[] arr) {
        long sum = 0;

        for (int x : arr) {
            sum += x;
        }

        return sum;
    }

    private static long maxArray(int[] arr) {
        long max = arr[0];

        for (int x : arr) {
            max = Math.max(max, x);
        }

        return max;
    }

    private static long minArray(int[] arr) {
        long min = arr[0];

        for (int x : arr) {
            min = Math.min(min, x);
        }
        
        return min;
    }

    private static long maxArray(long[] arr) {
        long max = arr[0];

        for (long x : arr) {
            max = Math.max(max, x);
        }

        return max;
    }

    private static long minArray(long[] arr) {
        long min = arr[0];

        for (long x : arr) {
            min = Math.min(min, x);
        }
        
        return min;
    }

    private static void printArray(int[] arr) {
        for (int i = 0; i < arr.length; i++) {
            out.print(arr[i]);

            if (i < arr.length - 1) {
                out.print(" ");
            }
        }

        out.println();
    }

    private static void printArray(long[] arr) {
        for (int i = 0; i < arr.length; i++) {
            out.print(arr[i]);

            if (i < arr.length - 1) {
                out.print(" ");
            }
        }

        out.println();
    }

    private static void printArray(String[] arr) {
        for (int i = 0; i < arr.length; i++) {
            out.print(arr[i]);

            if (i < arr.length - 1) {
                out.print(" ");
            }
        }

        out.println();
    }

    // ==================== DEBUG UTILITIES ====================
    private static void debug(Object... args) {
        System.err.print("DEBUG: ");
        for (int i = 0; i < args.length; i++) {
            if (args[i] instanceof int[]) {
                System.err.print(Arrays.toString((int[]) args[i]));
            } 
            else if (args[i] instanceof long[]) {
                System.err.print(Arrays.toString((long[]) args[i]));
            } 
            else if (args[i] instanceof double[]) {
                System.err.print(Arrays.toString((double[]) args[i]));
            } 
            else if (args[i] instanceof char[]) {
                System.err.print(Arrays.toString((char[]) args[i]));
            } 
            else if (args[i] instanceof Object[]) {
                System.err.print(Arrays.deepToString((Object[]) args[i]));
            } 
            else {
                System.err.print(args[i]);
            }
            if (i < args.length - 1) {
                System.err.print(", ");
            }
        }
        System.err.println();
    }

    // ==================== COMMON CONSTANTS ====================
    private static final int MOD = (int) 1e9 + 7;
    private static final int INF = (int) 2e9;
    private static final long LINF = (long) 1e18;

    // ==================== MAIN SOLUTION ====================

    private static void solve() throws Exception {
        int n = nextInt();
        int x = nextInt();
        int y = nextInt();
        int[] p = readIntArray(n);
        
        // Convert to 0-index portal split
        int L_end = x - 1;
        int M_start = x;
        int M_end = y - 1;

        ArrayList<Integer> L = new ArrayList<>();
        ArrayList<Integer> M = new ArrayList<>();
        ArrayList<Integer> R = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            if (i <= L_end) {
                L.add(p[i]);
            } else if (i >= M_start && i <= M_end) {
                M.add(p[i]);
            } else {
                R.add(p[i]);
            }
        }

        // M can be reordered arbitrarily through portal operations
        Collections.sort(M);

        ArrayList<Integer> result = new ArrayList<>();

        int i = 0; // pointer in M

        // Put smallest M elements before L if beneficial
        int lptr = 0;
        while (i < M.size() && lptr < L.size() && M.get(i) < L.get(lptr)) {
            result.add(M.get(i++));
        }

        // Add entire L (order fixed)
        result.addAll(L);

        // Add remaining M
        while (i < M.size()) {
            result.add(M.get(i++));
        }

        // Add R (order fixed)
        result.addAll(R);

        // Output
        for (int j = 0; j < result.size(); j++) {
            out.print(result.get(j));
            if (j < result.size() - 1) out.print(" ");
        }
        out.println();
    }

    private static long helper(int[] arr,int n, int node, Map<Integer, Long> map) {
        if (node >= n) {
            return 0;
        }

        int left = 2 * node + 1;
        int right = 2 * node + 2;

        if (left >= n && right >= n) {
            return 1L;
        }

        if (arr[left] == 0 && arr[right] == 0) {
            return 1L;
        }

        if (map.containsKey(node)) {
            return map.get(node);
        }

        long res = helper(arr, n, 2 * node + 1, map) + helper(arr, n, 2 * node + 2, map) + 3;
        map.put(node, res);
        return res;
    }

    public static void main(String[] args) throws Exception {
        int t = nextInt();
        
        while (t-- > 0) {
            solve();
        }
        
        out.flush();
        out.close();
    }
}